import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  deriveProjectName,
  fileToCompressedDataUrl,
  isHttpUrl,
  persistMaterialImage,
  resolveTestMaterial,
  wizardHasMaterialInput,
} from '../../lib/testMaterial';
import { runUserSimulation, type SimulationProgress } from '../../lib/userSimulation/runSimulation';
import type { FlowScreen, PersonaRun } from '../../types/userSimulation';
import { snapshotPersona } from '../../types/userSimulation';
import {
  PersonaPickerStep,
  PersonaSlotSelection,
  isPersonaPickerComplete,
} from '../../components/userTest/PersonaPickerStep';
import { UserTasksStep, hasValidUserTasks } from '../../components/userTest/UserTasksStep';
import { WizardBusinessFields } from '../../components/WizardFieldSelects';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  UploadIcon,
  LinkIcon,
  MonitorIcon,
  UsersIcon,
  DocumentIcon,
  PrototypeIcon,
  ImageIcon,
} from '../../components/icons';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ['חומרים', 'הקשר', 'פרסונות', 'משימות', 'הרצה'];

export function UserTestWizard() {
  const {
    navigate,
    setProjects,
    setCurrentProjectId,
    wizardTemplate,
    clearWizardTemplate,
    wizardFieldOptions,
    llmSettings,
    updateProject,
  } = useAppContext();

  const [step, setStep] = useState<Step>(1);
  const appliedTemplate = useRef(false);
  const [duplicatedFrom, setDuplicatedFrom] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    testType: 'static_design',
    url: '',
    domain: '',
    goal: '',
    stage: '',
    targetAudience: '',
  });
  const [flowScreens, setFlowScreens] = useState<FlowScreen[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState<SimulationProgress | null>(null);

  const [personaCount, setPersonaCount] = useState(2);
  const [personaSlots, setPersonaSlots] = useState<PersonaSlotSelection[]>([
    { mode: 'empty' },
    { mode: 'empty' },
  ]);
  const [userTasks, setUserTasks] = useState<string[]>(['']);

  useEffect(() => {
    if (!wizardTemplate || wizardTemplate.reviewKind !== 'user' || appliedTemplate.current) return;
    appliedTemplate.current = true;
    setFormData({
      name: wizardTemplate.name,
      testType: wizardTemplate.testType,
      url: wizardTemplate.url,
      domain: wizardTemplate.domain,
      goal: wizardTemplate.goal,
      stage: wizardTemplate.stage,
      targetAudience: wizardTemplate.targetAudience,
    });
    if (wizardTemplate.userTasks?.length) setUserTasks([...wizardTemplate.userTasks]);
    if (wizardTemplate.flowScreens?.length) setFlowScreens(wizardTemplate.flowScreens.map((s) => ({ ...s })));
    if (wizardTemplate.personaSnapshots?.length) {
      const count = wizardTemplate.personaSnapshots.length;
      setPersonaCount(count);
      setPersonaSlots(
        wizardTemplate.personaSnapshots.map((snapshot) => ({
          mode: 'library' as const,
          personaId: snapshot.id,
          snapshot,
        }))
      );
    }
    setDuplicatedFrom(wizardTemplate.sourceProjectName ?? null);
    clearWizardTemplate();
  }, [wizardTemplate, clearWizardTemplate]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 3 - flowScreens.length;
    if (remaining <= 0) {
      setMaterialError('ניתן להעלות עד 3 מסכים');
      return;
    }
    setMaterialError(null);
    const toAdd = Array.from(files).slice(0, remaining);
    try {
      const screens: FlowScreen[] = [];
      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        const dataUrl = await fileToCompressedDataUrl(file);
        screens.push({ label: `מסך ${flowScreens.length + i + 1}`, imageDataUrl: dataUrl });
      }
      setFlowScreens((prev) => [...prev, ...screens]);
      setUploadedFiles((prev) => [...prev, ...toAdd]);
    } catch {
      setMaterialError('שגיאה בטעינת התמונה');
    }
  };

  const hasMaterial = wizardHasMaterialInput(formData.url, uploadedFiles) || flowScreens.length > 0;

  const canAdvance = (): boolean => {
    if (step === 1) return hasMaterial;
    if (step === 3) return isPersonaPickerComplete(personaSlots, personaCount);
    if (step === 4) return hasValidUserTasks(userTasks);
    return true;
  };

  const buildPersonaRuns = (): PersonaRun[] =>
    personaSlots
      .filter((s): s is Exclude<PersonaSlotSelection, { mode: 'empty' }> => s.mode !== 'empty')
      .map((s, i) => ({
        id: `run-${Date.now()}-${i}`,
        personaId: s.snapshot.id,
        personaSnapshot: snapshotPersona(s.snapshot),
        status: 'pending' as const,
      }));

  const persistFlowScreens = async (projectId: string): Promise<FlowScreen[]> => {
    const persisted: FlowScreen[] = [];
    for (let i = 0; i < flowScreens.length; i++) {
      const screen = flowScreens[i];
      if (screen.imageDataUrl) {
        const stored = await persistMaterialImage(projectId, `screen-${i + 1}.jpg`, screen.imageDataUrl);
        persisted.push({
          label: screen.label ?? `מסך ${i + 1}`,
          imageUrl: stored.imageUrl,
          imageDataUrl: stored.imageDataUrl,
        });
      } else if (screen.imageUrl || screen.imageDataUrl) {
        persisted.push(screen);
      }
    }
    return persisted;
  };

  const handleRun = async () => {
    setStep(5);
    setPrepareError(null);
    setRunProgress(null);

    try {
      const projectId = 'proj-' + Date.now();
      let material = await resolveTestMaterial(formData.testType, formData.url, uploadedFiles, projectId);
      const persistedScreens = flowScreens.length ? await persistFlowScreens(projectId) : [];

      if (!materialHasImage(material) && persistedScreens[0]) {
        const first = persistedScreens[0];
        if (first.imageUrl || first.imageDataUrl) {
          material = {
            ...material,
            kind: 'image',
            imageUrl: first.imageUrl,
            imageDataUrl: first.imageDataUrl,
          };
        }
      }

      const displayUrl =
        material.sourceUrl ?? (isHttpUrl(formData.url) ? formData.url : material.fileNames?.join(', '));
      const projectName = formData.name.trim() || deriveProjectName(material, formData.url);

      const newProj = {
        id: projectId,
        ...formData,
        name: projectName,
        url: displayUrl,
        material,
        flowScreens: persistedScreens.length ? persistedScreens : flowScreens,
        userTasks: userTasks.filter((t) => t.trim()),
        personaRuns: buildPersonaRuns(),
        reviewKind: 'user' as const,
        userTestingEnabled: true,
        selectedExperts: [] as string[],
        testType: formData.testType as 'live_site' | 'static_design' | 'prototype' | 'prd',
        status: 'running' as const,
        simulationStatus: 'running' as const,
        createdAt: new Date().toISOString(),
      };

      setProjects((p) => [newProj, ...p]);
      setCurrentProjectId(projectId);

      const updates = await runUserSimulation(newProj, llmSettings, setRunProgress);
      updateProject(projectId, updates);
      navigate('user-simulation');
    } catch (error) {
      setPrepareError(error instanceof Error ? error.message : 'שגיאה בהרצת הסימולציה');
      setStep(4);
    }
  };

  function materialHasImage(material: { imageUrl?: string; imageDataUrl?: string }) {
    return Boolean(material.imageUrl || material.imageDataUrl);
  }

  const handleNext = () => {
    if (step === 1 && !hasMaterial) {
      setMaterialError('יש להזין קישור או להעלות לפחות מסך אחד.');
      return;
    }
    setMaterialError(null);
    if (step === 4) {
      handleRun();
      return;
    }
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--color-podium-primary-light)] border-t-[var(--color-podium-primary)] animate-spin" />
          <UsersIcon
            className="text-[var(--color-podium-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            size={40}
          />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-podium-text)]">מריץ סימולציית משתמשים...</h2>
          <p className="text-[var(--color-podium-text-secondary)] mt-2 text-sm">
            {runProgress
              ? `מנתח פרסונה ${runProgress.current} מתוך ${runProgress.total}: ${runProgress.personaName}`
              : 'מכין ניתוח לפי מתודולוגיית 9 השלבים'}
          </p>
          {prepareError && (
            <p className="text-[var(--color-podium-danger)] text-sm font-semibold mt-2">{prepareError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {duplicatedFrom && (
        <Card className="mb-4 border-[var(--color-podium-primary-muted)] bg-[var(--color-podium-primary-light)]">
          <p className="text-sm text-[var(--color-podium-primary)] font-semibold">
            הגדרות הועתקו מ&quot;{duplicatedFrom}&quot; — עדכנו חומרים והריצו מחדש.
          </p>
        </Card>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">בדיקת משתמשים</h1>
        <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
          העלו מסכים, הגדירו פרסונות ומשימות — הניתוח מבוסס על LLM ומתודולוגיית UX.
        </p>
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2">
          {STEP_LABELS.map((label, i) => {
            const num = (i + 1) as Step;
            return (
              <React.Fragment key={label}>
                <div className={cn('flex flex-col items-center shrink-0', step === num ? 'opacity-100' : step > num ? 'opacity-100' : 'opacity-40')}>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm',
                      step === num
                        ? 'bg-[var(--color-podium-primary)] text-white ring-4 ring-[var(--color-podium-primary-light)]'
                        : step > num
                          ? 'bg-[var(--color-podium-success)] text-white'
                          : 'bg-[var(--color-podium-border)] text-[var(--color-podium-text-tertiary)]'
                    )}
                  >
                    {step > num ? <CheckIcon size={16} /> : num}
                  </div>
                  <span className="text-xs font-semibold mt-2 text-[var(--color-podium-text-secondary)]">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 min-w-[24px] rounded-full mb-6', step > num ? 'bg-[var(--color-podium-success)]' : 'bg-[var(--color-podium-border)]')} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">מסכים לניתוח (עד 3)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['static_design', 'prototype', 'live_site', 'prd'].map((type) => {
                const labels: Record<string, string> = {
                  live_site: 'אתר חי',
                  static_design: 'עיצוב סטטי',
                  prototype: 'אבטיפוס',
                  prd: 'מסמך',
                };
                const icons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
                  live_site: MonitorIcon,
                  static_design: ImageIcon,
                  prototype: PrototypeIcon,
                  prd: DocumentIcon,
                };
                const TypeIcon = icons[type];
                const isSelected = formData.testType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, testType: type })}
                    className={cn(
                      'p-4 rounded-[var(--radius-podium-lg)] border-2 text-center transition-all flex flex-col items-center gap-2',
                      isSelected
                        ? 'border-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)] font-bold'
                        : 'border-[var(--color-podium-border)] bg-white text-[var(--color-podium-text-secondary)]'
                    )}
                  >
                    <TypeIcon size={20} />
                    <span className="text-sm">{labels[type]}</span>
                  </button>
                );
              })}
            </div>

            <Card className="space-y-4">
              <label className="block text-sm font-semibold">קישור (אופציונלי)</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                icon={<LinkIcon size={16} />}
                className="text-left dir-ltr pr-10"
                placeholder="https://"
              />
              <div className="flex flex-wrap gap-3">
                {flowScreens.map((screen, i) => (
                  <div key={i} className="relative">
                    {screen.imageDataUrl && (
                      <img src={screen.imageDataUrl} alt="" className="w-24 h-40 object-cover rounded-lg border" />
                    )}
                    <button
                      type="button"
                      onClick={() => setFlowScreens((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--color-podium-danger)] text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                    <span className="text-xs block text-center mt-1">{screen.label}</span>
                  </div>
                ))}
                {flowScreens.length < 3 && (
                  <label className="w-24 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-podium-primary)]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <UploadIcon size={20} />
                    <span className="text-xs mt-1">הוסף מסך</span>
                  </label>
                )}
              </div>
              {materialError && <p className="text-sm text-[var(--color-podium-danger)]">{materialError}</p>}
            </Card>

            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="שם הבדיקה (אופציונלי)"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">הקשר וקהל יעד</h2>
            <Card className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <WizardBusinessFields
                options={wizardFieldOptions}
                domain={formData.domain}
                stage={formData.stage}
                targetAudience={formData.targetAudience}
                goal={formData.goal}
                showStage={false}
                onGoalChange={(goal) => setFormData({ ...formData, goal })}
                onChange={(fields) => setFormData({ ...formData, ...fields })}
              />
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">בחירת פרסונות</h2>
            <PersonaPickerStep
              personaCount={personaCount}
              onPersonaCountChange={setPersonaCount}
              slots={personaSlots}
              onSlotsChange={setPersonaSlots}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">משימות המשתמש</h2>
            <UserTasksStep tasks={userTasks} onChange={setUserTasks} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[var(--color-podium-border)] p-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep((s) => (s - 1) as Step) : navigate('dashboard'))}
            icon={<ChevronRightIcon size={16} />}
            iconPosition="start"
          >
            {step === 1 ? 'חזרה לעמוד הבית' : 'הקודם'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canAdvance()}
            variant={step === 4 ? 'success' : 'primary'}
            icon={step !== 4 ? <ChevronLeftIcon size={16} /> : undefined}
          >
            {step === 4 ? 'הרץ סימולציה' : 'המשך'}
          </Button>
        </div>
      </div>
    </div>
  );
}
