import React, { useCallback, useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  checkProviderHealth,
  fetchInstalledModels,
  pullOllamaModel,
} from '../../lib/llmRouter';
import { DEFAULT_LLM_SETTINGS, DEFAULT_TASK_MODELS } from '../../lib/llmDefaults';
import {
  InstalledModel,
  LLM_TASK_DESCRIPTIONS,
  LLM_TASK_LABELS,
  LlmProvider,
  LlmTask,
  LocalModelConfig,
  RECOMMENDED_MODELS,
} from '../../types/llm';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const TASKS: LlmTask[] = [
  'vision_extract',
  'discussion_turn',
  'expert_reasoning',
  'report_aggregate',
  'user_simulation',
];

export function LlmSettingsCard() {
  const { llmSettings, setLlmSettings } = useAppContext();
  const [ollamaModels, setOllamaModels] = useState<InstalledModel[]>([]);
  const [lmModels, setLmModels] = useState<InstalledModel[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [checkingLm, setCheckingLm] = useState(false);

  const showStatus = (msg: string, isError = false) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), isError ? 8000 : 5000);
  };

  const refreshModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const [ollama, lm] = await Promise.all([
        fetchInstalledModels('ollama', llmSettings.ollamaBaseUrl).catch(() => []),
        fetchInstalledModels('lm_studio', llmSettings.lmStudioBaseUrl).catch(() => []),
      ]);
      setOllamaModels(ollama);
      setLmModels(lm);
      showStatus(`נטענו ${ollama.length + lm.length} מודלים`);
    } catch (error) {
      showStatus(error instanceof Error ? error.message : 'שגיאה בטעינת מודלים', true);
    } finally {
      setLoadingModels(false);
    }
  }, [llmSettings.ollamaBaseUrl, llmSettings.lmStudioBaseUrl]);

  const updateTaskModel = (task: LlmTask, patch: Partial<LocalModelConfig>) => {
    setLlmSettings((prev) => ({
      ...prev,
      taskModels: {
        ...prev.taskModels,
        [task]: { ...prev.taskModels[task], ...patch },
      },
    }));
  };

  const applyRecommendedModel = (task: LlmTask, modelId: string, vision: boolean) => {
    const provider: LlmProvider = 'ollama';
    updateTaskModel(task, {
      provider,
      baseUrl: llmSettings.ollamaBaseUrl,
      modelId,
      supportsVision: vision,
    });
  };

  const handlePullModel = async (modelId: string) => {
    setPullingModel(modelId);
    try {
      await pullOllamaModel(llmSettings.ollamaBaseUrl, modelId);
      showStatus(`המודל ${modelId} הותקן`);
      await refreshModels();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : 'הורדה נכשלה', true);
    } finally {
      setPullingModel(null);
    }
  };

  const modelsForProvider = (provider: LlmProvider): InstalledModel[] => {
    if (provider === 'ollama') return ollamaModels;
    if (provider === 'lm_studio') return lmModels;
    return [];
  };

  return (
    <Card padding="lg">
      <h2 className="font-bold text-[var(--color-podium-text)] mb-1">מנועי LLM מקומיים</h2>
      <p className="text-sm text-[var(--color-podium-text-secondary)] mb-4">
        הקצו מודל נפרד לכל משימה: Vision, דיון שורה-שורה, ניתוח מומחה ואיגוד דוח. נדרש{' '}
        <code className="text-xs bg-[var(--color-podium-surface-muted)] px-1 rounded">npm run dev</code>.
      </p>

      <div className="grid gap-6 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-1.5">
              Ollama
            </label>
            <Input
              value={llmSettings.ollamaBaseUrl}
              onChange={(e) =>
                setLlmSettings((prev) => ({ ...prev, ollamaBaseUrl: e.target.value.trim() }))
              }
              placeholder={DEFAULT_LLM_SETTINGS.ollamaBaseUrl}
              dir="ltr"
              className="text-left"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              disabled={checkingOllama}
              onClick={async () => {
                setCheckingOllama(true);
                const r = await checkProviderHealth('ollama', llmSettings.ollamaBaseUrl);
                showStatus(r.message, !r.ok);
                setCheckingOllama(false);
              }}
            >
              {checkingOllama ? 'בודק...' : 'בדיקת Ollama'}
            </Button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-1.5">
              LM Studio
            </label>
            <Input
              value={llmSettings.lmStudioBaseUrl}
              onChange={(e) =>
                setLlmSettings((prev) => ({ ...prev, lmStudioBaseUrl: e.target.value.trim() }))
              }
              placeholder={DEFAULT_LLM_SETTINGS.lmStudioBaseUrl}
              dir="ltr"
              className="text-left"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              disabled={checkingLm}
              onClick={async () => {
                setCheckingLm(true);
                const r = await checkProviderHealth('lm_studio', llmSettings.lmStudioBaseUrl);
                showStatus(r.message, !r.ok);
                setCheckingLm(false);
              }}
            >
              {checkingLm ? 'בודק...' : 'בדיקת LM Studio'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={refreshModels} disabled={loadingModels}>
            {loadingModels ? 'טוען...' : 'רענון רשימת מודלים'}
          </Button>
          {statusMessage && (
            <span
              className={cn(
                'text-sm font-semibold',
                statusMessage.includes('מחובר') || statusMessage.includes('נטענו')
                  ? 'text-[var(--color-podium-success)]'
                  : 'text-[var(--color-podium-danger)]'
              )}
            >
              {statusMessage}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-[var(--color-podium-text)] mb-2">מודלים מומלצים (Ollama)</h3>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_MODELS.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant="ghost"
                disabled={pullingModel === m.id}
                onClick={() => handlePullModel(m.id)}
              >
                {pullingModel === m.id ? 'מוריד...' : `הורד ${m.id}`}
              </Button>
            ))}
          </div>
        </div>

        {(ollamaModels.length > 0 || lmModels.length > 0) && (
          <div className="text-xs text-[var(--color-podium-text-secondary)] space-y-1">
            {ollamaModels.slice(0, 8).map((m) => (
              <div key={`o-${m.id}`} className="flex items-center gap-2">
                <Badge variant="default">Ollama</Badge>
                <span dir="ltr">{m.name}</span>
                {m.supportsVision && <Badge variant="info">Vision</Badge>}
              </div>
            ))}
            {lmModels.slice(0, 8).map((m) => (
              <div key={`l-${m.id}`} className="flex items-center gap-2">
                <Badge variant="primary">LM Studio</Badge>
                <span dir="ltr">{m.name}</span>
                {m.supportsVision && <Badge variant="info">Vision</Badge>}
              </div>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-[var(--color-podium-text)] mb-3">הקצאה לפי משימה</h3>
          <div className="space-y-4">
            {TASKS.map((task) => {
              const cfg = llmSettings.taskModels[task];
              const installed = modelsForProvider(cfg.provider);

              return (
                <div
                  key={task}
                  className="p-4 rounded-[var(--radius-podium-lg)] border border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-podium-text)]">
                        {LLM_TASK_LABELS[task]}
                      </p>
                      <p className="text-xs text-[var(--color-podium-text-tertiary)]">
                        {LLM_TASK_DESCRIPTIONS[task]}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {task === 'vision_extract' &&
                        RECOMMENDED_MODELS.filter((m) => m.vision).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="text-xs text-[var(--color-podium-primary)] font-semibold hover:underline"
                            onClick={() => applyRecommendedModel(task, m.id, true)}
                          >
                            {m.id}
                          </button>
                        ))}
                      {task !== 'vision_extract' &&
                        RECOMMENDED_MODELS.filter((m) => !m.vision).slice(0, 2).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="text-xs text-[var(--color-podium-primary)] font-semibold hover:underline"
                            onClick={() => applyRecommendedModel(task, m.id, false)}
                          >
                            {m.id}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">מקור</label>
                      <Select
                        value={cfg.provider}
                        onChange={(e) => {
                          const provider = e.target.value as LlmProvider;
                          const baseUrl =
                            provider === 'ollama'
                              ? llmSettings.ollamaBaseUrl
                              : provider === 'lm_studio'
                                ? llmSettings.lmStudioBaseUrl
                                : '';
                          updateTaskModel(task, {
                            provider,
                            baseUrl,
                            modelId: provider === 'mock' ? '' : cfg.modelId,
                          });
                        }}
                      >
                        <option value="mock">דמו (ללא LLM)</option>
                        <option value="ollama">Ollama</option>
                        <option value="lm_studio">LM Studio</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">מודל</label>
                      {installed.length > 0 && cfg.provider !== 'mock' ? (
                        <Select
                          value={cfg.modelId}
                          onChange={(e) => {
                            const model = installed.find((m) => m.id === e.target.value);
                            updateTaskModel(task, {
                              modelId: e.target.value,
                              supportsVision: model?.supportsVision ?? cfg.supportsVision,
                            });
                          }}
                          dir="ltr"
                          className="text-left"
                        >
                          <option value="">— בחרו —</option>
                          {installed.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          value={cfg.modelId}
                          onChange={(e) => updateTaskModel(task, { modelId: e.target.value.trim() })}
                          placeholder={DEFAULT_TASK_MODELS[task].modelId}
                          dir="ltr"
                          className="text-left"
                          disabled={cfg.provider === 'mock'}
                        />
                      )}
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pb-2.5">
                        <input
                          type="checkbox"
                          checked={cfg.supportsVision}
                          disabled={cfg.provider === 'mock'}
                          onChange={(e) =>
                            updateTaskModel(task, { supportsVision: e.target.checked })
                          }
                        />
                        תמיכת Vision
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
