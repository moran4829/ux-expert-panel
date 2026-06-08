import type { TestMaterial } from './types/material';
import type { AggregatedReport, ExpertReviewResult, ScreenExtraction } from './types/reviewEngine';

export type { TestMaterial, MaterialKind } from './types/material';

export type TestType = 'live_site' | 'static_design' | 'flow' | 'video' | 'prototype' | 'prd' | 'comparison' | 'retest';

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

export interface UserPersona {
  id: string;
  title: string;
  description: string;
}

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
  personas?: UserPersona[];
  status: 'draft' | 'running' | 'completed';
  createdAt: string;
  /** מתי הבדיקה הסתיימה (דוח / סימולציה) */
  completedAt?: string;
  scores?: Record<string, number>;
  messages?: DiscussionMessage[];
  findings?: Finding[];
  executiveSummary?: string;
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
}
