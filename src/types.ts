import type { TestMaterial } from './types/material';
import type { AggregatedReport, ExpertReviewResult, ScreenExtraction } from './types/reviewEngine';
import type {
  FlowScreen,
  PersonaRun,
  SimulationStatus,
  UserPersona,
} from './types/userSimulation';

export type {
  FlowScreen,
  PersonaQuestion,
  PersonaRun,
  PersonaRunStatus,
  PersonaWizardStep,
  Prioritization,
  SavedPersona,
  SimulationStatus,
  SolutionItem,
  UserPersona,
  UXMethodologyResult,
} from './types/userSimulation';

export type { TestMaterial, MaterialKind } from './types/material';

export interface Expert {
  id: string;
  name: string;
  archetype: string;
  role: string;
  avatar: string;
  avatarBg: string;
  color: string;
  description: string;
  focusAreas: string[];
}

export type ExpertContent = Pick<Expert, 'name' | 'archetype' | 'role' | 'description' | 'focusAreas'>;
export type ExpertEditableFields = ExpertContent & {
  avatar?: string;
  avatarBg?: string;
  skillExtra?: string;
};
export type ExpertOverrides = Record<string, Partial<ExpertEditableFields>>;

export interface DiscussionMessage {
  id: string;
  expertId: string | 'system' | 'user';
  text: string;
  type: 'observation' | 'conflict' | 'recommendation' | 'status';
  timestamp: string;
}

export type TestType = 'live_site' | 'static_design' | 'flow' | 'video' | 'prototype' | 'prd' | 'comparison' | 'retest';

export type ReviewKind = 'expert' | 'user';

export interface ReviewProject {
  id: string;
  name: string;
  /** expert = פאנל מומחים; user = סימולציית פרסונות */
  reviewKind: ReviewKind;
  testType: TestType;
  domain: string;
  goal: string;
  stage: string;
  targetAudience: string;
  url?: string;
  /** Parsed/uploaded material for vision + context (not just the url string) */
  material?: TestMaterial;
  /** JSON אובייקטיבי מחילוץ Vision לפני הדיון */
  screenExtraction?: ScreenExtraction;
  expertReviews?: ExpertReviewResult[];
  aggregatedReport?: AggregatedReport;
  selectedExperts: string[];
  /** רלוונטי לבדיקות משתמשים / כשהופעל במפורש בבדיקת מומחים (legacy) */
  userTestingEnabled: boolean;
  /** @deprecated legacy — use personaRuns */
  personas?: UserPersona[];
  userTasks?: string[];
  flowScreens?: FlowScreen[];
  personaRuns?: PersonaRun[];
  simulationStatus?: SimulationStatus;
  status: 'draft' | 'running' | 'completed';
  createdAt: string;
  /** מתי הבדיקה הסתיימה (דוח / סימולציה) */
  completedAt?: string;
  scores?: Record<string, number>;
  /** הסבר לכל ציון — למה התקבל הציון */
  scoreExplanations?: ScoreExplanation[];
  messages?: DiscussionMessage[];
  /** הודעות צ'אט בין המשתמש למומחים לאחר סיום הדיון */
  userChatMessages?: DiscussionMessage[];
  findings?: Finding[];
  executiveSummary?: string;
}

export type ScoreCategory = 'overall' | 'clarity' | 'usability' | 'trust' | 'accessibility';

export interface ScoreExplanation {
  key: ScoreCategory;
  label: string;
  score: number;
  explanation: string;
  factors: string[];
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  location: string;
  expertSources: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: string;
  effort: string;
  recommendation: string;
  status: 'new' | 'accepted' | 'rejected';
  /** מקור הממצא — דיון ראשוני או צ'אט עם המשתמש */
  findingSource?: 'panel' | 'user_chat';
}
