
export enum AnalysisStep {
  PERSONA = 'PERSONA',
  UPLOAD = 'UPLOAD',
  TASKS = 'TASKS',
  ANALYSIS = 'ANALYSIS'
}

export enum PersonaWizardStep {
  INPUT_ROLE = 'INPUT_ROLE',
  QUESTIONS = 'QUESTIONS',
  REVIEW = 'REVIEW'
}

export interface PersonaQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface CustomPersona {
  role: string; // "Who is it?"
  characteristics: string; // "Characteristics"
}

export interface PersonaOption {
  id: string;
  name: string;
  role: string;
  description: string;
}

export interface IntentOption {
  id: string;
  label: string;
  description: string;
}

export interface SolutionItem {
  component: string;
  problem: string;
  whyItsAProblem: string;
  abandonmentRisk: string; // e.g., "High", "Medium", "Low" or percentage
  solution: string;
}

export interface Prioritization {
  quickWins: string[];
  mediumImpact: string[];
  structuralRedesign: string[];
}

export interface UXMethodologyResult {
  // Step 1: Context Definition
  contextGoal: string;
  userCommitmentLevel: string;

  // Step 2: Attention Hierarchy
  firstElementSeen: string;
  secondElementSeen: string;
  hierarchyMatch: boolean; // Does visual hierarchy match business hierarchy?
  hierarchyAnalysis: string;

  // Step 3: Cognitive Load
  cognitiveLoadAnalysis: string;

  // Step 4: Emotional Friction
  emotionalAnalysis: string;

  // Step 5: Behavioral Friction
  frictionPoints: string[];
  estimatedDropOffRate: string;

  // Step 6: Trust & Risk
  trustAnalysis: string;

  // Step 7: Event & Funnel Hypothesis
  kpiToMeasure: string[];
  dropOffHypothesis: string;

  // Step 8: Solutions
  solutions: SolutionItem[];

  // Step 9: Prioritization
  prioritization: Prioritization;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
