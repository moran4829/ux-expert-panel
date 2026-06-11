import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { generatePersonaDescription, generatePersonaQuestions } from '../../lib/userSimulation/personaEngine';
import type { PersonaWizardStep, SavedPersona } from '../../types/userSimulation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { cn } from '../../lib/utils';

export type PersonaBuilderDraft = {
  name: string;
  role: string;
  characteristics: string;
  personaQuestions: SavedPersona['personaQuestions'];
  personaAnswers: Record<string, string[]>;
};

type PersonaBuilderWizardProps = {
  initial?: Partial<PersonaBuilderDraft>;
  onComplete: (draft: PersonaBuilderDraft) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function PersonaBuilderWizard({
  initial,
  onComplete,
  onCancel,
  submitLabel = 'שמירת פרסונה',
}: PersonaBuilderWizardProps) {
  const { llmSettings } = useAppContext();
  const [step, setStep] = useState<PersonaWizardStep>(
    initial?.characteristics ? 'REVIEW' : 'INPUT_ROLE'
  );
  const [draft, setDraft] = useState<PersonaBuilderDraft>({
    name: initial?.name ?? '',
    role: initial?.role ?? '',
    characteristics: initial?.characteristics ?? '',
    personaQuestions: initial?.personaQuestions ?? [],
    personaAnswers: initial?.personaAnswers ?? {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSubmit = async () => {
    if (!draft.role.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const questions = await generatePersonaQuestions(llmSettings, draft.role.trim());
      setDraft((prev) => ({ ...prev, personaQuestions: questions, personaAnswers: {} }));
      setStep('QUESTIONS');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת שאלות');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswersSubmit = async () => {
    const questions = draft.personaQuestions ?? [];
    if (questions.some((q) => !(draft.personaAnswers[q.id]?.length))) return;
    setLoading(true);
    setError(null);
    try {
      const qa = questions.map((q) => ({
        question: q.question,
        answer: draft.personaAnswers[q.id] ?? [],
      }));
      const description = await generatePersonaDescription(llmSettings, draft.role.trim(), qa);
      setDraft((prev) => ({
        ...prev,
        characteristics: description,
        name: prev.name.trim() || prev.role.trim(),
      }));
      setStep('REVIEW');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת פרופיל');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (questionId: string, option: string) => {
    setDraft((prev) => {
      const current = prev.personaAnswers[questionId] ?? [];
      const next = current.includes(option)
        ? current.filter((a) => a !== option)
        : [...current, option];
      return { ...prev, personaAnswers: { ...prev.personaAnswers, [questionId]: next } };
    });
  };

  const questionsAnswered =
    (draft.personaQuestions ?? []).length > 0 &&
    (draft.personaQuestions ?? []).every((q) => (draft.personaAnswers[q.id]?.length ?? 0) > 0);

  return (
    <Card className="space-y-5">
      {step === 'INPUT_ROLE' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-2">
              מי המשתמש? (תפקיד / זהות)
            </label>
            <Input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              placeholder="לדוגמה: מנהלת פרויקטים עמוסה, סטודנט שמחפש דירה..."
              onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-2">
              שם תצוגה (אופציונלי)
            </label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="יוגדר אוטומטית מהתפקיד אם ריק"
            />
          </div>
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                ביטול
              </Button>
            )}
            <Button onClick={handleRoleSubmit} disabled={!draft.role.trim() || loading}>
              {loading ? 'מייצר שאלות...' : 'המשך לאפיון'}
            </Button>
          </div>
        </div>
      )}

      {step === 'QUESTIONS' && (
        <div className="space-y-6">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">
            ענו על השאלות כדי לדייק את הפרסונה
          </p>
          {(draft.personaQuestions ?? []).map((q) => (
            <div key={q.id} className="space-y-2">
              <h4 className="font-semibold text-[var(--color-podium-text)]">{q.question}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const selected = draft.personaAnswers[q.id]?.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleAnswer(q.id, opt)}
                      className={cn(
                        'p-3 rounded-[var(--radius-podium-md)] border-2 text-right text-sm transition-all',
                        selected
                          ? 'border-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] font-semibold'
                          : 'border-[var(--color-podium-border)] hover:border-[var(--color-podium-primary)]/30'
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('INPUT_ROLE')}>
              חזרה
            </Button>
            <Button onClick={handleAnswersSubmit} disabled={!questionsAnswered || loading}>
              {loading ? 'מייצר פרופיל...' : 'צור פרופיל פרסונה'}
            </Button>
          </div>
        </div>
      )}

      {step === 'REVIEW' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-2">שם</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-2">תפקיד</label>
            <Input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-podium-text)] mb-2">
              מאפיינים (ניתן לעריכה)
            </label>
            <Textarea
              value={draft.characteristics}
              onChange={(e) => setDraft({ ...draft, characteristics: e.target.value })}
              className="min-h-[160px]"
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('QUESTIONS')}>
              חזרה
            </Button>
            <Button
              onClick={() =>
                onComplete({
                  ...draft,
                  name: draft.name.trim() || draft.role.trim(),
                })
              }
              disabled={!draft.role.trim() || !draft.characteristics.trim()}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-podium-danger)] font-semibold">{error}</p>}
    </Card>
  );
}
