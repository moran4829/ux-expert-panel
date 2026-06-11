export interface PersonaQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface SavedPersona {
  id: string;
  name: string;
  role: string;
  characteristics: string;
  personaQuestions?: PersonaQuestion[];
  personaAnswers?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionItem {
  component: string;
  problem: string;
  whyItsAProblem: string;
  abandonmentRisk: string;
  solution: string;
}

export interface Prioritization {
  quickWins: string[];
  mediumImpact: string[];
  structuralRedesign: string[];
}

export interface UXMethodologyResult {
  contextGoal: string;
  userCommitmentLevel: string;
  firstElementSeen: string;
  secondElementSeen: string;
  hierarchyMatch: boolean;
  hierarchyAnalysis: string;
  cognitiveLoadAnalysis: string;
  emotionalAnalysis: string;
  frictionPoints: string[];
  estimatedDropOffRate: string;
  trustAnalysis: string;
  kpiToMeasure: string[];
  dropOffHypothesis: string;
  solutions: SolutionItem[];
  prioritization: Prioritization;
}

export type PersonaRunStatus = 'pending' | 'running' | 'completed' | 'error';

export interface PersonaRun {
  id: string;
  personaId: string;
  personaSnapshot: SavedPersona;
  analysis?: UXMethodologyResult;
  status: PersonaRunStatus;
  error?: string;
}

export interface FlowScreen {
  label?: string;
  imageUrl?: string;
  imageDataUrl?: string;
}

export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error';

/** @deprecated legacy — use SavedPersona */
export interface UserPersona {
  id: string;
  title: string;
  description: string;
}

export type PersonaWizardStep = 'INPUT_ROLE' | 'QUESTIONS' | 'REVIEW';

export function cloneSavedPersona(persona: SavedPersona): SavedPersona {
  return {
    ...persona,
    personaQuestions: persona.personaQuestions?.map((q) => ({ ...q, options: [...q.options] })),
    personaAnswers: persona.personaAnswers ? { ...persona.personaAnswers } : undefined,
  };
}

export function snapshotPersona(persona: SavedPersona): SavedPersona {
  return cloneSavedPersona(persona);
}
