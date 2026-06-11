import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import type { SavedPersona } from '../../types/userSimulation';
import { snapshotPersona } from '../../types/userSimulation';
import { PersonaBuilderWizard, PersonaBuilderDraft } from './PersonaBuilderWizard';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export type PersonaSlotSelection =
  | { mode: 'library'; personaId: string; snapshot: SavedPersona }
  | { mode: 'new'; draft: PersonaBuilderDraft; saveToLibrary: boolean; snapshot: SavedPersona }
  | { mode: 'empty' };

type PersonaPickerStepProps = {
  personaCount: number;
  onPersonaCountChange: (count: number) => void;
  slots: PersonaSlotSelection[];
  onSlotsChange: (slots: PersonaSlotSelection[]) => void;
};

const COUNT_OPTIONS = [1, 2, 3, 4, 5];

export function PersonaPickerStep({
  personaCount,
  onPersonaCountChange,
  slots,
  onSlotsChange,
}: PersonaPickerStepProps) {
  const { personaLibrary, savePersonaFromWizard } = useAppContext();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [buildingNew, setBuildingNew] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const handleCountChange = (count: number) => {
    onPersonaCountChange(count);
    const next = [...slots];
    while (next.length < count) next.push({ mode: 'empty' });
    while (next.length > count) next.pop();
    onSlotsChange(next);
    setActiveSlot(null);
    setBuildingNew(false);
  };

  const selectFromLibrary = (slotIndex: number, persona: SavedPersona) => {
    const next = [...slots];
    next[slotIndex] = { mode: 'library', personaId: persona.id, snapshot: snapshotPersona(persona) };
    onSlotsChange(next);
    setActiveSlot(null);
  };

  const completeNewPersona = (slotIndex: number, draft: PersonaBuilderDraft) => {
    let saved = snapshotPersona({
      id: `temp-${Date.now()}`,
      name: draft.name,
      role: draft.role,
      characteristics: draft.characteristics,
      personaQuestions: draft.personaQuestions,
      personaAnswers: draft.personaAnswers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (saveToLibrary) {
      saved = savePersonaFromWizard({
        name: draft.name,
        role: draft.role,
        characteristics: draft.characteristics,
        personaQuestions: draft.personaQuestions,
        personaAnswers: draft.personaAnswers,
      });
    }

    const next = [...slots];
    next[slotIndex] = {
      mode: 'new',
      draft,
      saveToLibrary,
      snapshot: snapshotPersona(saved),
    };
    onSlotsChange(next);
    setBuildingNew(false);
    setActiveSlot(null);
  };

  const allFilled = slots.length === personaCount && slots.every((s) => s.mode !== 'empty');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-podium-text)] mb-3">
          כמה פרסונות להריץ?
        </h3>
        <div className="flex flex-wrap gap-2">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleCountChange(n)}
              className={cn(
                'w-12 h-12 rounded-[var(--radius-podium-md)] border-2 font-bold transition-all',
                personaCount === n
                  ? 'border-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)]'
                  : 'border-[var(--color-podium-border)] text-[var(--color-podium-text-secondary)]'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: personaCount }).map((_, index) => {
          const slot = slots[index] ?? { mode: 'empty' as const };
          const isActive = activeSlot === index;

          return (
            <Card key={index} padding="sm" className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="font-bold text-[var(--color-podium-text)]">פרסונה {index + 1}</h4>
                {slot.mode !== 'empty' && (
                  <span className="text-xs font-semibold text-[var(--color-podium-success)]">מוכנה</span>
                )}
              </div>

              {slot.mode !== 'empty' && !isActive && (
                <div className="mb-3 p-3 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-surface-muted)]">
                  <p className="font-semibold text-sm text-[var(--color-podium-text)]">{slot.snapshot.name}</p>
                  <p className="text-xs text-[var(--color-podium-text-secondary)] mt-1 line-clamp-2">
                    {slot.snapshot.characteristics}
                  </p>
                </div>
              )}

              {!isActive && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setActiveSlot(index)}>
                    {slot.mode === 'empty' ? 'בחירה / יצירה' : 'שינוי'}
                  </Button>
                  {slot.mode !== 'empty' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next = [...slots];
                        next[index] = { mode: 'empty' };
                        onSlotsChange(next);
                      }}
                    >
                      ניקוי
                    </Button>
                  )}
                </div>
              )}

              {isActive && !buildingNew && (
                <div className="space-y-3 mt-2">
                  <p className="text-sm text-[var(--color-podium-text-secondary)]">בחרו מהמאגר או צרו חדשה</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {personaLibrary.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => selectFromLibrary(index, persona)}
                        className="p-3 text-right rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] hover:border-[var(--color-podium-primary)] transition-colors"
                      >
                        <p className="font-semibold text-sm">{persona.name}</p>
                        <p className="text-xs text-[var(--color-podium-text-tertiary)] truncate">{persona.role}</p>
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => setBuildingNew(true)}>
                    פרסונה חדשה (AI)
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setActiveSlot(null)}>
                    סגירה
                  </Button>
                </div>
              )}

              {isActive && buildingNew && (
                <div className="mt-2 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-podium-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={saveToLibrary}
                      onChange={(e) => setSaveToLibrary(e.target.checked)}
                    />
                    שמור למאגר פרסונות
                  </label>
                  <PersonaBuilderWizard
                    onComplete={(draft) => completeNewPersona(index, draft)}
                    onCancel={() => setBuildingNew(false)}
                    submitLabel="הוסף לבדיקה"
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!allFilled && (
        <p className="text-sm text-[var(--color-podium-text-secondary)]">
          יש להגדיר {personaCount} פרסונות לפני המשך
        </p>
      )}
    </div>
  );
}

export function slotsToSnapshots(slots: PersonaSlotSelection[]): SavedPersona[] {
  return slots
    .filter((s): s is Exclude<PersonaSlotSelection, { mode: 'empty' }> => s.mode !== 'empty')
    .map((s) => s.snapshot);
}

export function isPersonaPickerComplete(slots: PersonaSlotSelection[], count: number): boolean {
  return slots.length === count && slots.every((s) => s.mode !== 'empty');
}
