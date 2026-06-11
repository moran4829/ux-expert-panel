import { resolveMaterialImageDataUrl } from '../testMaterial';
import type { ReviewProject } from '../../types';
import type { LlmSettings } from '../../types/llm';
import type { FlowScreen, PersonaRun } from '../../types/userSimulation';
import { analyzeFlow } from './personaEngine';

export type SimulationProgress = {
  current: number;
  total: number;
  personaName: string;
};

async function resolveFlowScreenDataUrls(screens: FlowScreen[]): Promise<string[]> {
  const urls: string[] = [];
  for (const screen of screens) {
    if (screen.imageDataUrl) {
      urls.push(screen.imageDataUrl);
    } else if (screen.imageUrl) {
      const response = await fetch(screen.imageUrl);
      if (!response.ok) continue;
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('קריאת תמונה נכשלה'));
        reader.readAsDataURL(blob);
      });
      urls.push(dataUrl);
    }
  }
  return urls;
}

export async function resolveProjectImages(project: ReviewProject): Promise<string[]> {
  if (project.flowScreens?.length) {
    const fromScreens = await resolveFlowScreenDataUrls(project.flowScreens);
    if (fromScreens.length) return fromScreens;
  }
  const single = await resolveMaterialImageDataUrl(project.material);
  return single ? [single] : [];
}

export async function runUserSimulation(
  project: ReviewProject,
  llmSettings: LlmSettings,
  onProgress?: (progress: SimulationProgress) => void
): Promise<Pick<ReviewProject, 'personaRuns' | 'simulationStatus' | 'status' | 'completedAt'>> {
  const runs = project.personaRuns ?? [];
  if (runs.length === 0) {
    throw new Error('לא נבחרו פרסונות לסימולציה');
  }

  const images = await resolveProjectImages(project);
  if (images.length === 0) {
    throw new Error('לא נמצאו תמונות לניתוח');
  }

  const tasks = (project.userTasks ?? []).filter((t) => t.trim());
  const updatedRuns: PersonaRun[] = [];

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    onProgress?.({
      current: i + 1,
      total: runs.length,
      personaName: run.personaSnapshot.name,
    });

    const runningRun: PersonaRun = { ...run, status: 'running', error: undefined };
    updatedRuns.push(runningRun);

    try {
      const analysis = await analyzeFlow(
        llmSettings,
        images,
        run.personaSnapshot,
        tasks,
        { goal: project.goal, targetAudience: project.targetAudience, domain: project.domain }
      );
      updatedRuns[i] = { ...runningRun, status: 'completed', analysis };
    } catch (err) {
      updatedRuns[i] = {
        ...runningRun,
        status: 'error',
        error: err instanceof Error ? err.message : 'שגיאה בניתוח',
      };
    }
  }

  const hasError = updatedRuns.some((r) => r.status === 'error');
  const allDone = updatedRuns.every((r) => r.status === 'completed');

  return {
    personaRuns: updatedRuns,
    simulationStatus: hasError ? 'error' : allDone ? 'completed' : 'running',
    status: allDone ? 'completed' : hasError ? 'completed' : 'running',
    completedAt: allDone || hasError ? new Date().toISOString() : undefined,
  };
}

export async function retryPersonaRun(
  project: ReviewProject,
  runId: string,
  llmSettings: LlmSettings
): Promise<PersonaRun[]> {
  const runs = project.personaRuns ?? [];
  const index = runs.findIndex((r) => r.id === runId);
  if (index < 0) throw new Error('ריצת פרסונה לא נמצאה');

  const images = await resolveProjectImages(project);
  const tasks = (project.userTasks ?? []).filter((t) => t.trim());
  const run = runs[index];

  const analysis = await analyzeFlow(
    llmSettings,
    images,
    run.personaSnapshot,
    tasks,
    { goal: project.goal, targetAudience: project.targetAudience, domain: project.domain }
  );

  const updated = [...runs];
  updated[index] = { ...run, status: 'completed', analysis, error: undefined };
  return updated;
}
