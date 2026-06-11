import { isHttpUrl } from './testMaterial';
import type { ReviewKind, ReviewProject, TestType } from '../types';
import type { FlowScreen, SavedPersona } from '../types/userSimulation';
import { snapshotPersona } from '../types/userSimulation';

export interface WizardTemplate {
  reviewKind: ReviewKind;
  name: string;
  testType: TestType;
  url: string;
  domain: string;
  goal: string;
  stage: string;
  targetAudience: string;
  selectedExperts: string[];
  userTasks?: string[];
  flowScreens?: FlowScreen[];
  personaSnapshots?: SavedPersona[];
  /** @deprecated */
  personas?: { id: string; title: string; description: string }[];
  sourceProjectName?: string;
}

export function projectToWizardTemplate(project: ReviewProject): WizardTemplate {
  const baseName = project.name.replace(/\s*\(עותק\)\s*$/g, '').trim();
  const httpUrl =
    [project.material?.sourceUrl, project.url].find((u) => u && isHttpUrl(u)) ?? '';

  const personaSnapshots =
    project.personaRuns?.map((r) => snapshotPersona(r.personaSnapshot)) ??
    project.personas?.map((p) =>
      snapshotPersona({
        id: p.id,
        name: p.title,
        role: p.title,
        characteristics: p.description,
        createdAt: project.createdAt,
        updatedAt: project.createdAt,
      })
    );

  return {
    reviewKind: project.reviewKind ?? 'expert',
    name: `${baseName} (עותק)`,
    testType: project.testType,
    url: httpUrl,
    domain: project.domain,
    goal: project.goal,
    stage: project.stage,
    targetAudience: project.targetAudience,
    selectedExperts: [...project.selectedExperts],
    userTasks: project.userTasks ? [...project.userTasks] : undefined,
    flowScreens: project.flowScreens?.map((s) => ({ ...s })),
    personaSnapshots,
    sourceProjectName: project.name,
  };
}
