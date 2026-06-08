export interface ScreenExtraction {
  screen_summary: string;
  visible_texts: string[];
  main_components: string[];
  navigation_elements: string[];
  forms_and_inputs: string[];
  buttons_and_ctas: string[];
  visual_hierarchy: {
    primary_area: string;
    secondary_areas: string[];
    dominant_elements: string[];
  };
  layout_structure: string;
  colors_and_contrast_notes: string[];
  possible_accessibility_observations: string[];
  unclear_elements: string[];
}

export type ExpertFindingSeverity = 'low' | 'medium' | 'high';

export interface ExpertFinding {
  issue: string;
  severity: ExpertFindingSeverity;
  evidence_from_screen: string;
  why_it_matters: string;
  recommendation: string;
}

export interface ExpertReviewResult {
  expert: string;
  summary: string;
  score: number;
  findings: ExpertFinding[];
  quick_wins: string[];
  open_questions: string[];
}

export interface AggregatedTopIssue {
  issue: string;
  severity: ExpertFindingSeverity;
  mentioned_by: string[];
  recommendation: string;
}

export interface PriorityAction {
  priority: number;
  action: string;
  expected_impact: string;
}

export interface AggregatedReport {
  overall_score: number;
  main_summary: string;
  top_issues: AggregatedTopIssue[];
  priority_action_plan: PriorityAction[];
  quick_wins: string[];
  requires_human_review: string[];
}
