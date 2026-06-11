import React from 'react';
import { Select, Textarea } from './ui/Input';
import type { WizardFieldOptions } from '../data/wizardOptions';

type WizardBusinessFieldsProps = {
  options: WizardFieldOptions;
  domain: string;
  stage: string;
  targetAudience: string;
  onChange: (fields: { domain?: string; stage?: string; targetAudience?: string }) => void;
  showStage?: boolean;
  goal: string;
  onGoalChange: (goal: string) => void;
};

export function WizardBusinessFields({
  options,
  domain,
  stage,
  targetAudience,
  onChange,
  showStage = true,
  goal,
  onGoalChange,
}: WizardBusinessFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[var(--color-podium-text)]">תחום המוצר</label>
        <Select value={domain} onChange={(e) => onChange({ domain: e.target.value })}>
          <option value="">— לא צוין —</option>
          {options.domains.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      {showStage && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--color-podium-text)]">שלב חיי המוצר</label>
          <Select value={stage} onChange={(e) => onChange({ stage: e.target.value })}>
            <option value="">— לא צוין —</option>
            {options.stages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-semibold text-[var(--color-podium-text)]">מטרת הבדיקה</label>
        <Textarea
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          className="min-h-[100px]"
          placeholder="מה אנחנו מנסים למצוא בבדיקה הזו?"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-semibold text-[var(--color-podium-text)]">קהל יעד (מי המשתמשים?)</label>
        <Select
          value={options.targetAudiences.includes(targetAudience) ? targetAudience : ''}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          className="mb-2"
        >
          <option value="">— בחרו תבנית או הזינו למטה —</option>
          {options.targetAudiences.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Textarea
          value={targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          className="min-h-[80px]"
          placeholder="גיל, רקע, אוריינות דיגיטלית..."
        />
      </div>
    </>
  );
}
