import { DEFAULT_LLM_SETTINGS, resolveBaseUrl } from './llmDefaults';
import { InstalledModel, LlmSettings, LlmTask, LocalModelConfig } from '../types/llm';
import type { ChatMessage, LlmApiProvider } from '../../vite-llm-api';

export type ChatOptions = {
  maxTokens?: number;
  temperature?: number;
};

export function getTaskConfig(settings: LlmSettings, task: LlmTask): LocalModelConfig {
  return settings.taskModels[task] ?? DEFAULT_LLM_SETTINGS.taskModels[task];
}

export function validateTaskConfig(task: LlmTask, config: LocalModelConfig): void {
  if (config.provider === 'mock') return;
  if (!config.modelId.trim()) {
    throw new Error(`לא הוגדר מודל למשימה: ${task}`);
  }
  if (task === 'vision_extract' && !config.supportsVision) {
    throw new Error('משימת ניתוח צילום דורשת מודל עם תמיכת Vision');
  }
}

export async function chatForTask(
  settings: LlmSettings,
  task: LlmTask,
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const config = getTaskConfig(settings, task);
  if (config.provider === 'mock') {
    throw new Error('מצב דמו — אין חיבור LLM למשימה זו');
  }

  validateTaskConfig(task, config);

  const provider = config.provider as LlmApiProvider;
  const baseUrl = resolveBaseUrl(settings, config.provider);

  const hasVision = messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === 'image_url')
  );

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      baseUrl,
      model: config.modelId,
      messages,
      maxTokens: options.maxTokens ?? (hasVision ? 2048 : task === 'report_aggregate' ? 2048 : 1024),
      temperature: options.temperature ?? (task === 'vision_extract' ? 0.2 : 0.55),
    }),
  });

  const data = (await response.json()) as { ok?: boolean; content?: string; message?: string };
  if (!response.ok || !data.ok || !data.content) {
    throw new Error(data.message ?? `שגיאה בביצוע משימת ${task}`);
  }

  return data.content;
}

export async function fetchInstalledModels(
  provider: 'ollama' | 'lm_studio',
  baseUrl: string
): Promise<InstalledModel[]> {
  const params = new URLSearchParams({ provider, baseUrl });
  const response = await fetch(`/api/llm/models?${params}`);
  const data = (await response.json()) as {
    ok?: boolean;
    models?: InstalledModel[];
    message?: string;
  };
  if (!response.ok || !data.ok || !data.models) {
    throw new Error(data.message ?? 'לא ניתן לטעון רשימת מודלים');
  }
  return data.models;
}

export async function pullOllamaModel(baseUrl: string, model: string): Promise<void> {
  const response = await fetch('/api/llm/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, model }),
  });
  const data = (await response.json()) as { ok?: boolean; message?: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.message ?? 'הורדת מודל נכשלה');
  }
}

export async function checkProviderHealth(
  provider: 'ollama' | 'lm_studio',
  baseUrl: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const params = new URLSearchParams({ provider, baseUrl });
    const response = await fetch(`/api/llm/health?${params}`);
    const data = (await response.json()) as { ok?: boolean; message?: string; modelCount?: number };
    if (data.ok) {
      const label = provider === 'ollama' ? 'Ollama' : 'LM Studio';
      const count =
        typeof data.modelCount === 'number' ? ` (${data.modelCount} מודלים)` : '';
      return { ok: true, message: `${label} מחובר${count}` };
    }
    return { ok: false, message: data.message ?? `${provider} לא זמין` };
  } catch {
    return { ok: false, message: 'לא ניתן להתחבר. הריצו npm run dev.' };
  }
}
