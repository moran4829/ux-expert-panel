import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_EXPERTS, getExpertContent, mergeExperts } from './data/experts';
import { getExpertEditableFields } from './lib/expertDefaults';
import { buildExpertSkillMarkdown, syncExpertSkillsToProject } from './lib/expertSkill';
import { DEFAULT_FINDINGS, DEFAULT_REPORT_SCORES } from './data/defaultFindings';
import { Expert, ExpertEditableFields, ExpertOverrides, ReviewProject } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './lib/storage';
import { DEFAULT_LLM_SETTINGS } from './lib/llmDefaults';
import { LlmSettings } from './types/llm';

interface AppContextType {
  activeRoute: string;
  navigate: (route: string) => void;
  projects: ReviewProject[];
  setProjects: React.Dispatch<React.SetStateAction<ReviewProject[]>>;
  updateProject: (id: string, updates: Partial<ReviewProject>) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  experts: Expert[];
  expertOverrides: ExpertOverrides;
  updateExpert: (id: string, fields: ExpertEditableFields, options?: { syncSkills?: boolean }) => Promise<{ skillSync?: string }>;
  resetExpert: (id: string) => Promise<void>;
  resetAllExperts: () => Promise<void>;
  syncAllSkills: () => Promise<{ ok: boolean; message: string }>;
  llmSettings: LlmSettings;
  setLlmSettings: React.Dispatch<React.SetStateAction<LlmSettings>>;
  importAppData: (data: {
    projects?: ReviewProject[];
    expertOverrides?: ExpertOverrides;
    llmSettings?: LlmSettings;
  }) => void;
  exportAppData: () => {
    projects: ReviewProject[];
    expertOverrides: ExpertOverrides;
    llmSettings: LlmSettings;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_PROJECTS: ReviewProject[] = [
  {
    id: 'proj-1',
    name: 'תהליך הצטרפות לביטוח רכב',
    reviewKind: 'expert',
    testType: 'flow',
    domain: 'ביטוח',
    goal: 'האם המשתמש מבין מתי הוא מסיים את התהליך ומה הכיסויים',
    stage: 'אתר חי',
    targetAudience: 'לקוחות קיימים וחדשים, גיל 25-60',
    selectedExperts: ['ux_don_norman', 'behavioral_economics', 'accessibility_wcag', 'marketing_cro'],
    userTestingEnabled: false,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    scores: {
      overall: 78,
      usability: 82,
      accessibility: 65,
      clarity: 74,
      cognitiveLoad: 60,
      trust: 78,
    },
    findings: DEFAULT_FINDINGS,
  },
];

function normalizeProject(project: ReviewProject): ReviewProject {
  const reviewKind = project.reviewKind ?? 'expert';
  if (project.status === 'completed' && !project.completedAt) {
    return { ...project, reviewKind, completedAt: project.createdAt };
  }
  return { ...project, reviewKind };
}

function loadInitialProjects(): ReviewProject[] {
  const stored = loadFromStorage<ReviewProject[]>(STORAGE_KEYS.projects);
  if (!stored) return INITIAL_PROJECTS;
  return stored.map(normalizeProject);
}

function loadInitialExpertOverrides(): ExpertOverrides {
  return loadFromStorage<ExpertOverrides>(STORAGE_KEYS.expertOverrides) ?? {};
}

function loadInitialLlmSettings(): LlmSettings {
  const saved = loadFromStorage<Partial<LlmSettings>>(STORAGE_KEYS.llmSettings);
  return saved ? { ...DEFAULT_LLM_SETTINGS, ...saved } : DEFAULT_LLM_SETTINGS;
}

function buildExperts(defaults: Expert[], overrides: ExpertOverrides): Expert[] {
  return mergeExperts(defaults, overrides);
}

async function pushSkills(experts: Expert[], overrides: ExpertOverrides) {
  return syncExpertSkillsToProject(experts, overrides);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [projects, setProjects] = useState<ReviewProject[]>(loadInitialProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [expertOverrides, setExpertOverrides] = useState<ExpertOverrides>(loadInitialExpertOverrides);
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(loadInitialLlmSettings);

  const experts = useMemo(
    () => buildExperts(DEFAULT_EXPERTS, expertOverrides),
    [expertOverrides]
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.projects, projects);
  }, [projects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.expertOverrides, expertOverrides);
  }, [expertOverrides]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.llmSettings, llmSettings);
  }, [llmSettings]);

  const navigate = (route: string) => setActiveRoute(route);

  const updateProject = (id: string, updates: Partial<ReviewProject>) => {
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, ...updates } : project)));
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
    const nextOverrides = { ...expertOverrides };
    delete nextOverrides[id];
    setExpertOverrides(nextOverrides);
    await pushSkills(buildExperts(DEFAULT_EXPERTS, nextOverrides), nextOverrides);
  };

  const resetAllExperts = async () => {
    setExpertOverrides({});
    await pushSkills(DEFAULT_EXPERTS, {});
  };

  const importAppData = (data: {
    projects?: ReviewProject[];
    expertOverrides?: ExpertOverrides;
    llmSettings?: LlmSettings;
  }) => {
    if (data.projects) setProjects(data.projects);
    if (data.expertOverrides) setExpertOverrides(data.expertOverrides);
    if (data.llmSettings) setLlmSettings({ ...DEFAULT_LLM_SETTINGS, ...data.llmSettings });
  };

  const exportAppData = () => ({
    projects,
    expertOverrides,
    llmSettings,
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
        experts,
        expertOverrides,
        updateExpert,
        resetExpert,
        resetAllExperts,
        syncAllSkills,
        llmSettings,
        setLlmSettings,
        importAppData,
        exportAppData,
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
