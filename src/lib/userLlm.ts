import {
  DEFAULT_LLM_SETTINGS,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_LM_STUDIO_BASE_URL,
} from './llmDefaults';
import type { LlmSettings, LlmTask, LocalModelConfig, UserLlmMode } from '../types/llm';

const ALL_TASKS: LlmTask[] = [
  'vision_extract',
  'discussion_turn',
  'expert_reasoning',
  'report_aggregate',
  'user_simulation',
];

const MOCK_CONFIG: LocalModelConfig = {
  provider: 'mock',
  baseUrl: '',
  modelId: '',
  supportsVision: false,
};

function isProductionHost(): boolean {
  return (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  );
}

export function createUnconfiguredUserLlmSettings(): LlmSettings {
  const taskModels = Object.fromEntries(
    ALL_TASKS.map((task) => [task, { ...MOCK_CONFIG }])
  ) as Record<LlmTask, LocalModelConfig>;

  return {
    ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    lmStudioBaseUrl: DEFAULT_LM_STUDIO_BASE_URL,
    taskModels,
    usesOwnLlmCredentials: true,
    llmConfigured: false,
  };
}

export function isUserLlmConfigured(settings: LlmSettings): boolean {
  if (!settings.usesOwnLlmCredentials) return true;

  if (!settings.llmConfigured) return false;

  if (isProductionHost()) {
    return settings.userLlmMode === 'gemini' && Boolean(settings.geminiApiKey?.trim());
  }

  if (settings.userLlmMode === 'gemini') {
    return Boolean(settings.geminiApiKey?.trim());
  }

  if (settings.userLlmMode === 'ollama' || settings.userLlmMode === 'lm_studio') {
    const cfg = settings.taskModels.discussion_turn;
    return cfg.provider !== 'mock' && Boolean(cfg.modelId?.trim());
  }

  return false;
}

export function applyUserLlmModeToSettings(
  prev: LlmSettings,
  mode: UserLlmMode,
  patch: {
    geminiApiKey?: string;
    geminiModel?: string;
    ollamaBaseUrl?: string;
    lmStudioBaseUrl?: string;
    localModelId?: string;
    supportsVision?: boolean;
  }
): LlmSettings {
  if (mode === 'gemini') {
    const modelId = patch.geminiModel?.trim() || 'gemini-2.0-flash';
    const geminiConfig: LocalModelConfig = {
      provider: 'gemini',
      baseUrl: '',
      modelId,
      supportsVision: true,
    };
    const taskModels = Object.fromEntries(
      ALL_TASKS.map((task) => [task, { ...geminiConfig }])
    ) as Record<LlmTask, LocalModelConfig>;

    return {
      ...prev,
      geminiApiKey: patch.geminiApiKey?.trim() || '',
      userLlmMode: 'gemini',
      usesOwnLlmCredentials: true,
      llmConfigured: true,
      taskModels,
    };
  }

  const provider = mode;
  const baseUrl =
    provider === 'ollama'
      ? (patch.ollamaBaseUrl?.trim() || prev.ollamaBaseUrl)
      : (patch.lmStudioBaseUrl?.trim() || prev.lmStudioBaseUrl);
  const modelId = patch.localModelId?.trim() || '';
  const supportsVision = patch.supportsVision ?? true;

  const localConfig: LocalModelConfig = {
    provider,
    baseUrl,
    modelId,
    supportsVision,
  };

  const taskModels = { ...prev.taskModels };
  for (const task of ALL_TASKS) {
    taskModels[task] = {
      ...localConfig,
      supportsVision: task === 'vision_extract' ? supportsVision : false,
    };
  }

  return {
    ...prev,
    ollamaBaseUrl: provider === 'ollama' ? baseUrl : prev.ollamaBaseUrl,
    lmStudioBaseUrl: provider === 'lm_studio' ? baseUrl : prev.lmStudioBaseUrl,
    userLlmMode: mode,
    usesOwnLlmCredentials: true,
    llmConfigured: true,
    geminiApiKey: undefined,
    taskModels,
  };
}

export function adminLlmSettings(): LlmSettings {
  return { ...DEFAULT_LLM_SETTINGS, usesOwnLlmCredentials: false };
}

export function resolveEffectiveLlmSettings(settings: LlmSettings, isAdmin: boolean): LlmSettings {
  if (isAdmin) return adminLlmSettings();
  return settings;
}
