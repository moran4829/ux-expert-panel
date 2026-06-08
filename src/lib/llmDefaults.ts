import { LlmSettings, LlmTask, LocalModelConfig } from '../types/llm';

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
export const DEFAULT_LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';

const OLLAMA_VISION: LocalModelConfig = {
  provider: 'ollama',
  baseUrl: DEFAULT_OLLAMA_BASE_URL,
  modelId: 'qwen2.5vl:7b',
  supportsVision: true,
};

const OLLAMA_TEXT_14B: LocalModelConfig = {
  provider: 'ollama',
  baseUrl: DEFAULT_OLLAMA_BASE_URL,
  modelId: 'qwen3:14b',
  supportsVision: false,
};

const OLLAMA_TEXT_30B: LocalModelConfig = {
  provider: 'ollama',
  baseUrl: DEFAULT_OLLAMA_BASE_URL,
  modelId: 'qwen3:30b',
  supportsVision: false,
};

const MOCK_CONFIG: LocalModelConfig = {
  provider: 'mock',
  baseUrl: '',
  modelId: '',
  supportsVision: false,
};

export const DEFAULT_TASK_MODELS: Record<LlmTask, LocalModelConfig> = {
  vision_extract: OLLAMA_VISION,
  discussion_turn: OLLAMA_TEXT_14B,
  expert_reasoning: OLLAMA_TEXT_14B,
  report_aggregate: OLLAMA_TEXT_30B,
  user_simulation: OLLAMA_TEXT_14B,
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
    return base;
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
  base.lmStudioBaseUrl = legacyUrl;

  return base;
}

export function isLocalLlmActive(settings: LlmSettings): boolean {
  return settings.taskModels.discussion_turn.provider !== 'mock';
}

export function resolveBaseUrl(settings: LlmSettings, provider: LocalModelConfig['provider']): string {
  if (provider === 'ollama') return settings.ollamaBaseUrl.replace(/\/$/, '');
  if (provider === 'lm_studio') return settings.lmStudioBaseUrl.replace(/\/$/, '');
  return '';
}
