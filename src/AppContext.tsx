import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_EXPERTS, getExpertContent, mergeExperts } from './data/experts';
import { getExpertEditableFields } from './lib/expertDefaults';
import { buildExpertSkillMarkdown, syncExpertSkillsToProject } from './lib/expertSkill';
import { DEFAULT_FINDINGS, DEFAULT_REPORT_SCORES } from './data/defaultFindings';
import { Expert, ExpertEditableFields, ExpertOverrides, ReviewProject } from './types';
import type { SavedPersona } from './types/userSimulation';
import { cloneSavedPersona } from './types/userSimulation';
import { DEFAULT_PERSONA_LIBRARY } from './data/defaultPersonaLibrary';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './lib/storage';
import { DEFAULT_LLM_SETTINGS, migrateLlmSettings } from './lib/llmDefaults';
import { LlmSettings } from './types/llm';
import { createUnconfiguredUserLlmSettings } from './lib/userLlm';
import type { WizardTemplate } from './lib/wizardTemplate';
import { projectToWizardTemplate } from './lib/wizardTemplate';
import { getReviewKind } from './lib/projectKind';
import {
  DEFAULT_WIZARD_FIELD_OPTIONS,
  normalizeWizardFieldOptions,
  WizardFieldOptions,
} from './data/wizardOptions';
import { useAuth } from './context/AuthContext';
import {
  loadUserAppData,
  saveUserAppData,
  listAllProjectsForAdmin,
  type AdminProjectRow,
} from './lib/userDataFirestore';

interface AppContextType {
  activeRoute: string;
  navigate: (route: string) => void;
  projects: ReviewProject[];
  setProjects: React.Dispatch<React.SetStateAction<ReviewProject[]>>;
  updateProject: (id: string, updates: Partial<ReviewProject>) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  wizardTemplate: WizardTemplate | null;
  duplicateProject: (id: string) => void;
  clearWizardTemplate: () => void;
  deleteProject: (id: string) => void;
  experts: Expert[];
  expertOverrides: ExpertOverrides;
  updateExpert: (id: string, fields: ExpertEditableFields, options?: { syncSkills?: boolean }) => Promise<{ skillSync?: string }>;
  resetExpert: (id: string) => Promise<void>;
  resetAllExperts: () => Promise<void>;
  syncAllSkills: () => Promise<{ ok: boolean; message: string }>;
  llmSettings: LlmSettings;
  setLlmSettings: React.Dispatch<React.SetStateAction<LlmSettings>>;
  wizardFieldOptions: WizardFieldOptions;
  setWizardFieldOptions: React.Dispatch<React.SetStateAction<WizardFieldOptions>>;
  personaLibrary: SavedPersona[];
  addPersona: (persona: Omit<SavedPersona, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => SavedPersona;
  updatePersona: (id: string, updates: Partial<SavedPersona>) => void;
  deletePersona: (id: string) => void;
  duplicatePersona: (id: string) => SavedPersona | null;
  savePersonaFromWizard: (draft: Omit<SavedPersona, 'id' | 'createdAt' | 'updatedAt'>) => SavedPersona;
  importAppData: (data: {
    projects?: ReviewProject[];
    expertOverrides?: ExpertOverrides;
    llmSettings?: LlmSettings;
    wizardFieldOptions?: Partial<WizardFieldOptions>;
    personaLibrary?: SavedPersona[];
  }) => void;
  exportAppData: () => {
    projects: ReviewProject[];
    expertOverrides: ExpertOverrides;
    llmSettings: LlmSettings;
    wizardFieldOptions: WizardFieldOptions;
    personaLibrary: SavedPersona[];
  };
  dataLoading: boolean;
  dataSyncError: string | null;
  pendingLocalMigration: boolean;
  importLocalDataToCloud: () => Promise<void>;
  viewAsUserId: string | null;
  setViewAsUserId: (uid: string | null) => void;
  isViewingAsOtherUser: boolean;
  adminAllProjects: AdminProjectRow[];
  refreshAdminData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizeProject(project: ReviewProject): ReviewProject {
  const reviewKind = project.reviewKind ?? 'expert';
  if (project.status === 'completed' && !project.completedAt) {
    return { ...project, reviewKind, completedAt: project.createdAt };
  }
  return { ...project, reviewKind };
}

function loadLocalSnapshot() {
  const projects = loadFromStorage<ReviewProject[]>(STORAGE_KEYS.projects);
  const expertOverrides = loadFromStorage<ExpertOverrides>(STORAGE_KEYS.expertOverrides) ?? {};
  const llmRaw = loadFromStorage<Partial<LlmSettings>>(STORAGE_KEYS.llmSettings);
  const llmSettings = llmRaw ? migrateLlmSettings(llmRaw) : DEFAULT_LLM_SETTINGS;
  const wizardRaw = loadFromStorage<Partial<WizardFieldOptions>>(STORAGE_KEYS.wizardFieldOptions);
  const wizardFieldOptions = normalizeWizardFieldOptions(wizardRaw ?? DEFAULT_WIZARD_FIELD_OPTIONS);
  const personaStored = loadFromStorage<SavedPersona[]>(STORAGE_KEYS.personaLibrary);
  const personaLibrary = personaStored?.length
    ? personaStored
    : DEFAULT_PERSONA_LIBRARY.map(cloneSavedPersona);

  return {
    projects: (projects ?? []).map(normalizeProject),
    expertOverrides,
    llmSettings,
    wizardFieldOptions,
    personaLibrary,
  };
}

function hasLocalData(): boolean {
  return Boolean(
    loadFromStorage(STORAGE_KEYS.projects) ||
      loadFromStorage(STORAGE_KEYS.personaLibrary) ||
      loadFromStorage(STORAGE_KEYS.expertOverrides) ||
      loadFromStorage(STORAGE_KEYS.llmSettings)
  );
}

function normalizeLlmSettingsForUser(
  raw: Partial<LlmSettings> | undefined,
  isAdminUser: boolean
): LlmSettings {
  if (isAdminUser) {
    return raw ? migrateLlmSettings(raw) : DEFAULT_LLM_SETTINGS;
  }
  if (!raw) return createUnconfiguredUserLlmSettings();
  const migrated = migrateLlmSettings(raw);
  if (migrated.usesOwnLlmCredentials !== true) {
    return createUnconfiguredUserLlmSettings();
  }
  return migrated;
}

function buildExperts(defaults: Expert[], overrides: ExpertOverrides): Expert[] {
  return mergeExperts(defaults, overrides);
}

async function pushSkills(experts: Expert[], overrides: ExpertOverrides) {
  return syncExpertSkillsToProject(experts, overrides);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const uid = user?.uid ?? null;

  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [projects, setProjects] = useState<ReviewProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [wizardTemplate, setWizardTemplate] = useState<WizardTemplate | null>(null);
  const [expertOverrides, setExpertOverrides] = useState<ExpertOverrides>({});
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(DEFAULT_LLM_SETTINGS);
  const [wizardFieldOptions, setWizardFieldOptions] = useState<WizardFieldOptions>(DEFAULT_WIZARD_FIELD_OPTIONS);
  const [personaLibrary, setPersonaLibrary] = useState<SavedPersona[]>(
    DEFAULT_PERSONA_LIBRARY.map(cloneSavedPersona)
  );

  const [dataLoading, setDataLoading] = useState(true);
  const [dataSyncError, setDataSyncError] = useState<string | null>(null);
  const [pendingLocalMigration, setPendingLocalMigration] = useState(false);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [adminAllProjects, setAdminAllProjects] = useState<AdminProjectRow[]>([]);

  const skipCloudSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataOwnerId = viewAsUserId ?? uid;
  const isViewingAsOtherUser = Boolean(viewAsUserId && viewAsUserId !== uid);

  const experts = useMemo(
    () => buildExperts(DEFAULT_EXPERTS, expertOverrides),
    [expertOverrides]
  );

  const applySnapshot = useCallback(
    (snapshot: ReturnType<typeof loadLocalSnapshot>) => {
      setProjects(snapshot.projects);
      setExpertOverrides(snapshot.expertOverrides);
      setLlmSettings(snapshot.llmSettings);
      setWizardFieldOptions(snapshot.wizardFieldOptions);
      setPersonaLibrary(snapshot.personaLibrary);
    },
    []
  );

  const refreshAdminData = useCallback(async () => {
    if (!isAdmin) {
      setAdminAllProjects([]);
      return;
    }
    const rows = await listAllProjectsForAdmin();
    setAdminAllProjects(rows);
  }, [isAdmin]);

  useEffect(() => {
    if (!uid || !dataOwnerId) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;

    async function hydrate() {
      setDataLoading(true);
      setDataSyncError(null);
      skipCloudSave.current = true;

      try {
        const cloud = await loadUserAppData(dataOwnerId);

        if (cancelled) return;

        if (cloud) {
          setProjects(cloud.projects.map(normalizeProject));
          setLlmSettings(
            normalizeLlmSettingsForUser(cloud.settings.llmSettings, isAdmin)
          );
          if (cloud.settings.wizardFieldOptions) {
            setWizardFieldOptions(normalizeWizardFieldOptions(cloud.settings.wizardFieldOptions));
          }
          setExpertOverrides(cloud.settings.expertOverrides ?? {});
          setPersonaLibrary(
            cloud.personas.length ? cloud.personas : DEFAULT_PERSONA_LIBRARY.map(cloneSavedPersona)
          );
          setPendingLocalMigration(false);
        } else if (!viewAsUserId && hasLocalData()) {
          applySnapshot(loadLocalSnapshot());
          if (!isAdmin) {
            setLlmSettings(createUnconfiguredUserLlmSettings());
          }
          setPendingLocalMigration(true);
        } else {
          setProjects([]);
          setExpertOverrides({});
          setLlmSettings(
            isAdmin ? DEFAULT_LLM_SETTINGS : createUnconfiguredUserLlmSettings()
          );
          setWizardFieldOptions(DEFAULT_WIZARD_FIELD_OPTIONS);
          setPersonaLibrary(DEFAULT_PERSONA_LIBRARY.map(cloneSavedPersona));
          setPendingLocalMigration(false);
        }
      } catch (error) {
        if (!cancelled) {
          setDataSyncError(error instanceof Error ? error.message : 'טעינת נתונים נכשלה');
          applySnapshot(loadLocalSnapshot());
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
          skipCloudSave.current = false;
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [uid, dataOwnerId, viewAsUserId, isAdmin, applySnapshot]);

  useEffect(() => {
    if (isAdmin) void refreshAdminData();
  }, [isAdmin, refreshAdminData]);

  const persistToCloud = useCallback(async () => {
    if (!uid || skipCloudSave.current || isViewingAsOtherUser) return;

    try {
      await saveUserAppData(uid, {
        projects,
        personas: personaLibrary,
        settings: { expertOverrides, llmSettings, wizardFieldOptions },
      });
      setDataSyncError(null);
    } catch (error) {
      setDataSyncError(error instanceof Error ? error.message : 'שמירה לענן נכשלה');
    }
  }, [
    uid,
    isViewingAsOtherUser,
    projects,
    personaLibrary,
    expertOverrides,
    llmSettings,
    wizardFieldOptions,
  ]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistToCloud();
    }, 900);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    uid,
    isViewingAsOtherUser,
    projects,
    personaLibrary,
    expertOverrides,
    llmSettings,
    wizardFieldOptions,
    persistToCloud,
  ]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;
    saveToStorage(STORAGE_KEYS.projects, projects);
  }, [uid, isViewingAsOtherUser, projects]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;
    saveToStorage(STORAGE_KEYS.expertOverrides, expertOverrides);
  }, [uid, isViewingAsOtherUser, expertOverrides]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;
    saveToStorage(STORAGE_KEYS.llmSettings, llmSettings);
  }, [uid, isViewingAsOtherUser, llmSettings]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;
    saveToStorage(STORAGE_KEYS.wizardFieldOptions, wizardFieldOptions);
  }, [uid, isViewingAsOtherUser, wizardFieldOptions]);

  useEffect(() => {
    if (!uid || isViewingAsOtherUser) return;
    saveToStorage(STORAGE_KEYS.personaLibrary, personaLibrary);
  }, [uid, isViewingAsOtherUser, personaLibrary]);

  const importLocalDataToCloud = useCallback(async () => {
    if (!uid) return;
    skipCloudSave.current = true;
    const snapshot = loadLocalSnapshot();
    applySnapshot(snapshot);
    try {
      await saveUserAppData(uid, {
        projects: snapshot.projects,
        personas: snapshot.personaLibrary,
        settings: {
          expertOverrides: snapshot.expertOverrides,
          llmSettings: snapshot.llmSettings,
          wizardFieldOptions: snapshot.wizardFieldOptions,
        },
      });
      setPendingLocalMigration(false);
      setDataSyncError(null);
    } catch (error) {
      setDataSyncError(error instanceof Error ? error.message : 'ייבוא לענן נכשל');
      throw error;
    } finally {
      skipCloudSave.current = false;
    }
  }, [uid, applySnapshot]);

  const navigate = (route: string) => setActiveRoute(route);

  const updateProject = (id: string, updates: Partial<ReviewProject>) => {
    if (isViewingAsOtherUser) return;
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, ...updates } : project)));
  };

  const clearWizardTemplate = () => setWizardTemplate(null);

  const duplicateProject = (id: string) => {
    if (isViewingAsOtherUser) return;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setWizardTemplate(projectToWizardTemplate(project));
    navigate(getReviewKind(project) === 'user' ? 'user-test' : 'expert-test');
  };

  const deleteProject = (id: string) => {
    if (isViewingAsOtherUser) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setCurrentProjectId((current) => (current === id ? null : current));
  };

  const syncAllSkills = async () => {
    const result = await pushSkills(experts, expertOverrides);
    return { ok: result.ok, message: result.message };
  };

  const updateExpert = async (
    id: string,
    fields: ExpertEditableFields,
    options?: { syncSkills?: boolean }
  ) => {
    if (isViewingAsOtherUser) return {};
    const nextOverrides: ExpertOverrides = {
      ...expertOverrides,
      [id]: fields,
    };

    setExpertOverrides(nextOverrides);

    if (options?.syncSkills === false) {
      return {};
    }

    const nextExperts = buildExperts(DEFAULT_EXPERTS, nextOverrides);
    const result = await pushSkills(nextExperts, nextOverrides);
    return { skillSync: result.message };
  };

  const resetExpert = async (id: string) => {
    if (isViewingAsOtherUser) return;
    const nextOverrides = { ...expertOverrides };
    delete nextOverrides[id];
    setExpertOverrides(nextOverrides);
    await pushSkills(buildExperts(DEFAULT_EXPERTS, nextOverrides), nextOverrides);
  };

  const resetAllExperts = async () => {
    if (isViewingAsOtherUser) return;
    setExpertOverrides({});
    await pushSkills(DEFAULT_EXPERTS, {});
  };

  const addPersona = (
    persona: Omit<SavedPersona, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): SavedPersona => {
    const ts = new Date().toISOString();
    const entry: SavedPersona = {
      id: persona.id ?? `persona-${Date.now()}`,
      name: persona.name,
      role: persona.role,
      characteristics: persona.characteristics,
      personaQuestions: persona.personaQuestions?.map((q) => ({ ...q, options: [...q.options] })),
      personaAnswers: persona.personaAnswers ? { ...persona.personaAnswers } : undefined,
      createdAt: ts,
      updatedAt: ts,
    };
    if (!isViewingAsOtherUser) {
      setPersonaLibrary((prev) => [entry, ...prev]);
    }
    return entry;
  };

  const updatePersona = (id: string, updates: Partial<SavedPersona>) => {
    if (isViewingAsOtherUser) return;
    setPersonaLibrary((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const deletePersona = (id: string) => {
    if (isViewingAsOtherUser) return;
    setPersonaLibrary((prev) => prev.filter((p) => p.id !== id));
  };

  const duplicatePersona = (id: string): SavedPersona | null => {
    if (isViewingAsOtherUser) return null;
    const source = personaLibrary.find((p) => p.id === id);
    if (!source) return null;
    return addPersona({
      ...cloneSavedPersona(source),
      name: `${source.name} (עותק)`,
    });
  };

  const savePersonaFromWizard = (
    draft: Omit<SavedPersona, 'id' | 'createdAt' | 'updatedAt'>
  ): SavedPersona => addPersona(draft);

  const importAppData = (data: {
    projects?: ReviewProject[];
    expertOverrides?: ExpertOverrides;
    llmSettings?: LlmSettings;
    wizardFieldOptions?: Partial<WizardFieldOptions>;
    personaLibrary?: SavedPersona[];
  }) => {
    if (isViewingAsOtherUser) return;
    if (data.projects) setProjects(data.projects);
    if (data.expertOverrides) setExpertOverrides(data.expertOverrides);
    if (data.llmSettings) setLlmSettings(migrateLlmSettings(data.llmSettings));
    if (data.wizardFieldOptions) {
      setWizardFieldOptions(normalizeWizardFieldOptions(data.wizardFieldOptions));
    }
    if (data.personaLibrary) setPersonaLibrary(data.personaLibrary);
  };

  const exportAppData = () => ({
    projects,
    expertOverrides,
    llmSettings,
    wizardFieldOptions,
    personaLibrary,
  });

  return (
    <AppContext.Provider
      value={{
        activeRoute,
        navigate,
        projects,
        setProjects,
        updateProject,
        currentProjectId,
        setCurrentProjectId,
        wizardTemplate,
        duplicateProject,
        clearWizardTemplate,
        deleteProject,
        experts,
        expertOverrides,
        updateExpert,
        resetExpert,
        resetAllExperts,
        syncAllSkills,
        llmSettings,
        setLlmSettings,
        wizardFieldOptions,
        setWizardFieldOptions,
        personaLibrary,
        addPersona,
        updatePersona,
        deletePersona,
        duplicatePersona,
        savePersonaFromWizard,
        importAppData,
        exportAppData,
        dataLoading,
        dataSyncError,
        pendingLocalMigration,
        importLocalDataToCloud,
        viewAsUserId,
        setViewAsUserId,
        isViewingAsOtherUser,
        adminAllProjects,
        refreshAdminData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

export { DEFAULT_REPORT_SCORES, DEFAULT_FINDINGS, getExpertContent, getExpertEditableFields, buildExpertSkillMarkdown };
