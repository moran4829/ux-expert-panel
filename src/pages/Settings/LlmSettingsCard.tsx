import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { checkLmStudioHealth } from '../../lib/llm';
import { DEFAULT_LLM_SETTINGS } from '../../lib/llmDefaults';
import { LlmProvider } from '../../types/llm';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';

export function LlmSettingsCard() {
  const { llmSettings, setLlmSettings } = useAppContext();
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleProviderChange = (provider: LlmProvider) => {
    setLlmSettings((prev) => ({ ...prev, provider }));
  };

  const handleTestConnection = async () => {
    setChecking(true);
    setHealthMessage(null);
    const result = await checkLmStudioHealth(llmSettings.lmStudioBaseUrl);
    setHealthMessage(result.message);
    setChecking(false);
    setTimeout(() => setHealthMessage(null), 5000);
  };

  return (
    <Card padding="lg">
      <h2 className="font-bold text-[var(--color-podium-text)] mb-1">מנוע דיון (LLM)</h2>
      <p className="text-sm text-[var(--color-podium-text-secondary)] mb-4">
        בחרו בין דיון דמו מוכן מראש לבין מודל מקומי ב-LM Studio. נדרש{' '}
        <code className="text-xs bg-[var(--color-podium-surface-muted)] px-1 rounded">npm run dev</code>.
      </p>

      <div className="grid gap-4 max-w-xl">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-1.5">
            מקור דיון
          </label>
          <Select
            value={llmSettings.provider}
            onChange={(e) => handleProviderChange(e.target.value as LlmProvider)}
          >
            <option value="mock">דמו — הודעות מוכנות מראש</option>
            <option value="lm_studio">LM Studio — מודל מקומי</option>
          </Select>
        </div>

        {llmSettings.provider === 'lm_studio' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-1.5">
                כתובת שרת LM Studio
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
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-1.5">
                שם מודל
              </label>
              <Input
                value={llmSettings.lmStudioModel}
                onChange={(e) =>
                  setLlmSettings((prev) => ({ ...prev, lmStudioModel: e.target.value.trim() }))
                }
                placeholder={DEFAULT_LLM_SETTINGS.lmStudioModel}
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1">
                ברירת מחדל: {DEFAULT_LLM_SETTINGS.lmStudioModel}. מודלי Gemma 4 עם חשיבה דורשים מספיק
                Max Tokens ב-LM Studio (האפליקציה שולחת 1024).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={handleTestConnection} disabled={checking}>
                {checking ? 'בודק...' : 'בדיקת חיבור'}
              </Button>
              {healthMessage && (
                <span
                  className={cn(
                    'text-sm font-semibold',
                    healthMessage.includes('מחובר')
                      ? 'text-[var(--color-podium-success)]'
                      : 'text-[var(--color-podium-danger)]'
                  )}
                >
                  {healthMessage}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
