import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  checkProviderHealth,
  fetchInstalledModels,
  testGeminiConnection,
} from '../../lib/llmRouter';
import { applyUserLlmModeToSettings } from '../../lib/userLlm';
import type { UserLlmMode } from '../../types/llm';
import { DEFAULT_LLM_SETTINGS } from '../../lib/llmDefaults';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

type UserLlmSetupFormProps = {
  onComplete?: () => void;
  compact?: boolean;
};

export function UserLlmSetupForm({ onComplete, compact }: UserLlmSetupFormProps) {
  const { llmSettings, setLlmSettings } = useAppContext();
  const [mode, setMode] = useState<UserLlmMode>(
    isLocalDevHost() ? 'lm_studio' : 'gemini'
  );
  const [geminiApiKey, setGeminiApiKey] = useState(llmSettings.geminiApiKey ?? '');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(llmSettings.ollamaBaseUrl);
  const [lmStudioBaseUrl, setLmStudioBaseUrl] = useState(llmSettings.lmStudioBaseUrl);
  const [localModelId, setLocalModelId] = useState('');
  const [localModels, setLocalModels] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshLocalModels = useCallback(async () => {
    if (mode === 'gemini') return;
    try {
      const provider = mode;
      const baseUrl = provider === 'ollama' ? ollamaBaseUrl : lmStudioBaseUrl;
      const models = await fetchInstalledModels(provider, baseUrl);
      setLocalModels(models.map((m) => ({ id: m.id, name: m.name })));
      if (models.length && !localModelId) {
        setLocalModelId(models[0].id);
      }
    } catch {
      setLocalModels([]);
    }
  }, [mode, ollamaBaseUrl, lmStudioBaseUrl, localModelId]);

  useEffect(() => {
    void refreshLocalModels();
  }, [refreshLocalModels]);

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      if (mode === 'gemini') {
        if (!geminiApiKey.trim()) {
          setStatusOk(false);
          setStatus('הזינו מפתח Gemini API');
          return;
        }
        const result = await testGeminiConnection(geminiApiKey.trim(), geminiModel);
        setStatusOk(result.ok);
        setStatus(result.message);
        return;
      }

      const provider = mode;
      const baseUrl = provider === 'ollama' ? ollamaBaseUrl : lmStudioBaseUrl;
      const result = await checkProviderHealth(provider, baseUrl);
      setStatusOk(result.ok);
      setStatus(result.message);
      if (result.ok) await refreshLocalModels();
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (mode === 'gemini' && !geminiApiKey.trim()) {
        setStatusOk(false);
        setStatus('הזינו מפתח Gemini API');
        return;
      }
      if (mode !== 'gemini' && !localModelId.trim()) {
        setStatusOk(false);
        setStatus('בחרו או הזינו שם מודל');
        return;
      }

      const next = applyUserLlmModeToSettings(llmSettings, mode, {
        geminiApiKey: geminiApiKey.trim(),
        geminiModel,
        ollamaBaseUrl,
        lmStudioBaseUrl,
        localModelId: localModelId.trim(),
        supportsVision: true,
      });

      setLlmSettings(next);
      setStatusOk(true);
      setStatus('החיבור נשמר');
      onComplete?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg" className={cn('login-card border-white/80', compact && 'shadow-none')}>
      <h2 className="text-lg font-bold text-[var(--color-podium-text)] mb-1">
        חיבור LLM אישי
      </h2>
      <p className="text-sm text-[var(--color-podium-text-secondary)] mb-5 leading-relaxed">
        הבדיקות ירוצו על החשבון והטוקנים שלכם — לא על חשבון האדמין.
        {isLocalDevHost() && (
          <>
            {' '}
            בסביבת פיתוח מקומית ניתן לחבר Ollama או LM Studio; בפרודקשן — מפתח Gemini.
          </>
        )}
      </p>

      <div className="flex rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] p-1 mb-6 bg-[var(--color-podium-surface-muted)]">
        {(
          [
            { id: 'gemini' as const, label: 'Gemini (ענן)' },
            { id: 'ollama' as const, label: 'Ollama (מקומי)' },
            { id: 'lm_studio' as const, label: 'LM Studio' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={cn(
              'flex-1 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-podium-sm)] transition-all',
              mode === tab.id
                ? 'bg-[var(--color-podium-primary)] text-white shadow-[var(--shadow-podium-sm)]'
                : 'text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'gemini' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
              מפתח Gemini API
            </label>
            <Input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIza..."
              dir="ltr"
              className="text-left"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1.5">
              ניתן ליצור מפתח ב-{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-podium-primary)] underline"
              >
                Google AI Studio
              </a>
              . המפתח נשמר בחשבון שלכם בלבד.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
              מודל
            </label>
            <Select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="text-left dir-ltr"
            >
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
              {mode === 'ollama' ? 'כתובת Ollama' : 'כתובת LM Studio'}
            </label>
            <Input
              value={mode === 'ollama' ? ollamaBaseUrl : lmStudioBaseUrl}
              onChange={(e) =>
                mode === 'ollama'
                  ? setOllamaBaseUrl(e.target.value.trim())
                  : setLmStudioBaseUrl(e.target.value.trim())
              }
              placeholder={
                mode === 'ollama'
                  ? DEFAULT_LLM_SETTINGS.ollamaBaseUrl
                  : DEFAULT_LLM_SETTINGS.lmStudioBaseUrl
              }
              dir="ltr"
              className="text-left"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
              מודל
            </label>
            {localModels.length > 0 ? (
              <Select
                value={localModelId}
                onChange={(e) => setLocalModelId(e.target.value)}
                className="text-left dir-ltr"
              >
                <option value="">— בחרו —</option>
                {localModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={localModelId}
                onChange={(e) => setLocalModelId(e.target.value.trim())}
                placeholder="google/gemma-4-e4b"
                dir="ltr"
                className="text-left"
              />
            )}
          </div>
        </div>
      )}

      {status && (
        <p
          className={cn(
            'text-sm mt-4 font-medium',
            statusOk ? 'text-[var(--color-podium-success)]' : 'text-[var(--color-podium-danger)]'
          )}
        >
          {status}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        <Button type="button" variant="secondary" onClick={handleTest} disabled={testing || saving}>
          {testing ? 'בודק...' : 'בדיקת חיבור'}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || testing}>
          {saving ? 'שומר...' : 'שמירה והמשך'}
        </Button>
      </div>
    </Card>
  );
}
