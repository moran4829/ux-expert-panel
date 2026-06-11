import { LlmSettings, LlmTask, LocalModelConfig } from '../types/llm';

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
export const DEFAULT_LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';

const LM_STUDIO_VISION: LocalModelConfig = {
  provider: 'lm_studio',
  baseUrl: DEFAULT_LM_STUDIO_BASE_URL,
  modelId: 'google/gemma-4-e4b',
  supportsVision: true,
};

const LM_STUDIO_TEXT: LocalModelConfig = {
  provider: 'lm_studio',
  baseUrl: DEFAULT_LM_STUDIO_BASE_URL,
  modelId: 'google/gemma-4-e4b',
  supportsVision: true,
};

/** מזהי מודל Ollama POC — ממופים אוטומטית ל-LM Studio אם Ollama לא מותקן */
const OLLAMA_POC_MODEL_IDS = new Set(['qwen2.5vl:7b', 'qwen3:14b', 'qwen3:30b']);

const MOCK_CONFIG: LocalModelConfig = {
  provider: 'mock',
  baseUrl: '',
  modelId: '',
  supportsVision: false,
};

export const DEFAULT_TASK_MODELS: Record<LlmTask, LocalModelConfig> = {
  vision_extract: LM_STUDIO_VISION,
  discussion_turn: LM_STUDIO_TEXT,
  expert_reasoning: LM_STUDIO_TEXT,
  report_aggregate: LM_STUDIO_TEXT,
  user_simulation: LM_STUDIO_TEXT,
};

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
  lmStudioBaseUrl: DEFAULT_LM_STUDIO_BASE_URL,
  taskModels: { ...DEFAULT_TASK_MODELS },
};

type LegacyLlmSettings = {
  provider?: 'mock' | 'lm_studio';
  lmStudioBaseUrl?: string;
  lmStudioModel?: string;
};

function isLocalModelConfig(value: unknown): value is LocalModelConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as LocalModelConfig;
  return (
    typeof v.provider === 'string' &&
    typeof v.baseUrl === 'string' &&
    typeof v.modelId === 'string' &&
    typeof v.supportsVision === 'boolean'
  );
}

function migrateOllamaToLmStudio(settings: LlmSettings): LlmSettings {
  const usesOllama = (Object.values(settings.taskModels) as LocalModelConfig[]).some(
    (cfg) => cfg.provider === 'ollama'
  );
  if (!usesOllama) return settings;

  const lmFallback: LocalModelConfig = {
    provider: 'lm_studio',
    baseUrl: settings.lmStudioBaseUrl,
    modelId: 'google/gemma-4-e4b',
    supportsVision: true,
  };

  const taskModels = { ...settings.taskModels };
  for (const task of Object.keys(taskModels) as LlmTask[]) {
    const cfg = taskModels[task];
    const isLegacyPoc = cfg.provider === 'ollama' && OLLAMA_POC_MODEL_IDS.has(cfg.modelId);
    if (cfg.provider === 'ollama' && (isLegacyPoc || cfg.modelId)) {
      taskModels[task] = {
        ...lmFallback,
        supportsVision: task === 'vision_extract' ? true : cfg.supportsVision,
      };
    }
  }
  return { ...settings, taskModels };
}

export function migrateLlmSettings(saved: Partial<LlmSettings> & LegacyLlmSettings): LlmSettings {
  const base: LlmSettings = {
    ollamaBaseUrl: saved.ollamaBaseUrl ?? DEFAULT_OLLAMA_BASE_URL,
    lmStudioBaseUrl: saved.lmStudioBaseUrl ?? DEFAULT_LM_STUDIO_BASE_URL,
    taskModels: { ...DEFAULT_TASK_MODELS },
  };

  if (saved.taskModels) {
    for (const task of Object.keys(DEFAULT_TASK_MODELS) as LlmTask[]) {
      const cfg = saved.taskModels[task];
      if (isLocalModelConfig(cfg)) {
        base.taskModels[task] = {
          ...cfg,
          baseUrl:
            cfg.baseUrl ||
            (cfg.provider === 'ollama'
              ? base.ollamaBaseUrl
              : cfg.provider === 'lm_studio'
                ? base.lmStudioBaseUrl
                : ''),
        };
      }
    }
    return migrateOllamaToLmStudio(base);
  }

  const legacyProvider = saved.provider ?? 'lm_studio';
  const legacyUrl = saved.lmStudioBaseUrl ?? DEFAULT_LM_STUDIO_BASE_URL;
  const legacyModel = saved.lmStudioModel ?? 'google/gemma-4-e4b';

  if (legacyProvider === 'mock') {
    return base;
  }

  const legacyConfig: LocalModelConfig = {
    provider: 'lm_studio',
    baseUrl: legacyUrl,
    modelId: legacyModel,
    supportsVision: true,
  };

  base.taskModels.discussion_turn = legacyConfig;
  base.taskModels.vision_extract = { ...legacyConfig, supportsVision: true };
  base.taskModels.expert_reasoning = legacyConfig;
  base.taskModels.report_aggregate = legacyConfig;
  base.taskModels.user_simulation = legacyConfig;
  base.lmStudioBaseUrl = legacyUrl;

  return migrateOllamaToLmStudio(base);
}

export function isLocalLlmActive(settings: LlmSettings): boolean {
  return settings.taskModels.discussion_turn.provider !== 'mock';
}

export function resolveBaseUrl(settings: LlmSettings, provider: LocalModelConfig['provider']): string {
  if (provider === 'ollama') return settings.ollamaBaseUrl.replace(/\/$/, '');
  if (provider === 'lm_studio') return settings.lmStudioBaseUrl.replace(/\/$/, '');
  return '';
}
