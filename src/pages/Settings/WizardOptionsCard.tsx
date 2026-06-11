import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  DEFAULT_WIZARD_FIELD_OPTIONS,
  WIZARD_OPTION_FIELD_LABELS,
  WizardOptionField,
} from '../../data/wizardOptions';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { CheckIcon } from '../../components/icons';

const FIELDS: WizardOptionField[] = ['domains', 'stages', 'targetAudiences'];

export function WizardOptionsCard() {
  const { wizardFieldOptions, setWizardFieldOptions } = useAppContext();
  const [draft, setDraft] = useState(wizardFieldOptions);
  const [newValues, setNewValues] = useState<Record<WizardOptionField, string>>({
    domains: '',
    stages: '',
    targetAudiences: '',
  });
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setDraft(wizardFieldOptions);
  }, [wizardFieldOptions]);

  const addOption = (field: WizardOptionField) => {
    const value = newValues[field].trim();
    if (!value || draft[field].includes(value)) return;
    setDraft((prev) => ({ ...prev, [field]: [...prev[field], value] }));
    setNewValues((prev) => ({ ...prev, [field]: '' }));
  };

  const removeOption = (field: WizardOptionField, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }));
  };

  const handleSave = () => {
    setWizardFieldOptions(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_WIZARD_FIELD_OPTIONS });
    setWizardFieldOptions({ ...DEFAULT_WIZARD_FIELD_OPTIONS });
  };

  return (
    <Card padding="lg">
      <h2 className="font-bold text-[var(--color-podium-text)] mb-1">שדות בחירה בוויזארד בדיקה</h2>
      <p className="text-sm text-[var(--color-podium-text-secondary)] mb-6">
        ערכים אלה מופיעים בשלב &quot;הקשר עסקי&quot; בעת הקמת בדיקה. ברירות המחדל מוגדרות בקוד (
        <code className="text-xs">src/data/wizardOptions.ts</code>) ונשמרות גם ב-localStorage.
      </p>

      <div className="space-y-6">
        {FIELDS.map((field) => (
          <div key={field} className="p-4 rounded-[var(--radius-podium-lg)] border border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]/50">
            <h3 className="font-semibold text-sm text-[var(--color-podium-text)] mb-3">
              {WIZARD_OPTION_FIELD_LABELS[field]}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {draft[field].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--color-podium-border)] text-sm text-[var(--color-podium-text)]"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeOption(field, item)}
                    className="text-[var(--color-podium-text-tertiary)] hover:text-[var(--color-podium-danger)] font-bold leading-none"
                    title="הסרה"
                  >
                    ×
                  </button>
                </span>
              ))}
              {draft[field].length === 0 && (
                <span className="text-sm text-[var(--color-podium-text-tertiary)]">אין ערכים</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newValues[field]}
                onChange={(e) => setNewValues((prev) => ({ ...prev, [field]: e.target.value }))}
                placeholder="הוספת ערך חדש..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption(field);
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => addOption(field)}>
                הוסף
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-[var(--color-podium-border)]">
        <Button onClick={handleSave} icon={<CheckIcon size={16} />}>
          {saved ? 'נשמר!' : 'שמירת רשימות'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          איפוס לברירת מחדל מהקוד
        </Button>
      </div>
    </Card>
  );
}
