export type LlmProvider = 'mock' | 'ollama' | 'lm_studio';

export type LlmTask =
  | 'vision_extract'
  | 'discussion_turn'
  | 'expert_reasoning'
  | 'report_aggregate'
  | 'user_simulation';

export interface LocalModelConfig {
  provider: LlmProvider;
  baseUrl: string;
  modelId: string;
  supportsVision: boolean;
}

export interface LlmSettings {
  ollamaBaseUrl: string;
  lmStudioBaseUrl: string;
  taskModels: Record<LlmTask, LocalModelConfig>;
}

export interface InstalledModel {
  id: string;
  name: string;
  supportsVision: boolean;
  sizeBytes?: number;
}

export const LLM_TASK_LABELS: Record<LlmTask, string> = {
  vision_extract: 'ניתוח צילום מסך (Vision)',
  discussion_turn: 'דיון מומחים שורה-שורה',
  expert_reasoning: 'ניתוח מומחה מובנה (JSON)',
  report_aggregate: 'איגוד דוח סופי',
  user_simulation: 'סימולציית משתמשים',
};

export const LLM_TASK_DESCRIPTIONS: Record<LlmTask, string> = {
  vision_extract: 'חילוץ JSON אובייקטיבי מהצילום — ללא המלצות UX',
  discussion_turn: 'כל תור מומחה בחדר הדיון',
  expert_reasoning: 'ניתוח מובנה לפי פרספקטיבת מומחה',
  report_aggregate: 'מיזוג ממצאים לתוכנית פעולה',
  user_simulation: 'הרצת פרסונות בבדיקת משתמשים',
};

export const RECOMMENDED_MODELS = [
  { id: 'qwen2.5vl:7b', label: 'Qwen2.5-VL 7B (Vision POC)', vision: true },
  { id: 'qwen2.5vl:32b', label: 'Qwen2.5-VL 32B (Vision)', vision: true },
  { id: 'qwen3:14b', label: 'Qwen3 14B (Reasoning POC)', vision: false },
  { id: 'qwen3:30b', label: 'Qwen3 30B (Reasoning)', vision: false },
] as const;
