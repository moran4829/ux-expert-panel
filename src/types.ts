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

export interface ReviewProject {
  id: string;
  name: string;
  testType: TestType;
  domain: string;
  goal: string;
  stage: string;
  targetAudience: string;
  url?: string;
  selectedExperts: string[];
  userTestingEnabled: boolean;
  status: 'draft' | 'running' | 'completed';
  createdAt: string;
  scores?: Record<string, number>;
  messages?: DiscussionMessage[];
  findings?: Finding[];
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
