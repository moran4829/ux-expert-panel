import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import type { SavedPersona } from '../../types/userSimulation';
import { PersonaBuilderWizard, PersonaBuilderDraft } from '../../components/userTest/PersonaBuilderWizard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { DuplicateIcon, TrashIcon } from '../../components/icons';
import { formatDateHe } from '../../lib/formatDate';

type View = 'list' | 'manual' | 'ai';

export function PersonaLibrary() {
  const { personaLibrary, addPersona, updatePersona, deletePersona, duplicatePersona } = useAppContext();
  const [view, setView] = useState<View>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualDraft, setManualDraft] = useState({ name: '', role: '', characteristics: '' });
  const [aiInitial, setAiInitial] = useState<Partial<PersonaBuilderDraft>>();

  const editingPersona = editingId ? personaLibrary.find((p) => p.id === editingId) : null;
  const isEditing = Boolean(editingId);

  const resetEditor = () => {
    setView('list');
    setEditingId(null);
    setManualDraft({ name: '', role: '', characteristics: '' });
    setAiInitial(undefined);
  };

  const openCreateManual = () => {
    setEditingId(null);
    setManualDraft({ name: '', role: '', characteristics: '' });
    setView('manual');
  };

  const openCreateAi = () => {
    setEditingId(null);
    setAiInitial(undefined);
    setView('ai');
  };

  const openEdit = (persona: SavedPersona) => {
    setEditingId(persona.id);
    setManualDraft({
      name: persona.name,
      role: persona.role,
      characteristics: persona.characteristics,
    });
    setView('manual');
  };

  const openEditAi = (persona: SavedPersona) => {
    setEditingId(persona.id);
    setAiInitial({
      name: persona.name,
      role: persona.role,
      characteristics: persona.characteristics,
      personaQuestions: persona.personaQuestions,
      personaAnswers: persona.personaAnswers ?? {},
    });
    setView('ai');
  };

  const handleManualSave = () => {
    if (!manualDraft.name.trim() || !manualDraft.role.trim()) return;
    if (isEditing && editingId) {
      updatePersona(editingId, manualDraft);
    } else {
      addPersona(manualDraft);
    }
    resetEditor();
  };

  const handleAiComplete = (draft: PersonaBuilderDraft) => {
    const payload = {
      name: draft.name,
      role: draft.role,
      characteristics: draft.characteristics,
      personaQuestions: draft.personaQuestions,
      personaAnswers: draft.personaAnswers,
    };
    if (isEditing && editingId) {
      updatePersona(editingId, payload);
    } else {
      addPersona(payload);
    }
    resetEditor();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">מאגר פרסונות</h1>
          <p className="text-sm text-[var(--color-podium-text-secondary)] mt-1">
            {personaLibrary.length} פרסונות שמורות — ניתן לערוך, לשכפל ולהשתמש בבדיקות חוזרות
          </p>
        </div>
        {view === 'list' && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={openCreateManual}>
              יצירה ידנית
            </Button>
            <Button onClick={openCreateAi}>יצירה עם AI</Button>
          </div>
        )}
      </header>

      {view === 'list' && (
        <div className="space-y-3">
          {personaLibrary.length === 0 && (
            <Card padding="lg" className="text-center text-[var(--color-podium-text-secondary)]">
              אין פרסונות במאגר. צרו פרסונה ראשונה.
            </Card>
          )}
          {personaLibrary.map((persona) => (
            <Card key={persona.id} className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--color-podium-text)]">{persona.name}</h3>
                <p className="text-sm text-[var(--color-podium-primary)] font-medium">{persona.role}</p>
                <p className="text-sm text-[var(--color-podium-text-secondary)] mt-2 line-clamp-2">
                  {persona.characteristics}
                </p>
                <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-2">
                  עודכן: {formatDateHe(persona.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => openEdit(persona)}>
                  עריכה
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEditAi(persona)}>
                  AI מחדש
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<DuplicateIcon size={14} />}
                  onClick={() => duplicatePersona(persona.id)}
                >
                  שכפל
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`למחוק את "${persona.name}"?`)) deletePersona(persona.id);
                  }}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-podium-border)] hover:bg-[var(--color-podium-danger-bg)] hover:text-[var(--color-podium-danger)]"
                  title="מחיקה"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {view === 'manual' && (
        <Card className="space-y-4 max-w-2xl">
          <h2 className="font-bold text-[var(--color-podium-text)]">
            {isEditing ? `עריכת "${editingPersona?.name}"` : 'פרסונה חדשה'}
          </h2>
          <div>
            <label className="block text-sm font-semibold mb-1">שם</label>
            <Input value={manualDraft.name} onChange={(e) => setManualDraft({ ...manualDraft, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">תפקיד</label>
            <Input value={manualDraft.role} onChange={(e) => setManualDraft({ ...manualDraft, role: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">מאפיינים</label>
            <Textarea
              value={manualDraft.characteristics}
              onChange={(e) => setManualDraft({ ...manualDraft, characteristics: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleManualSave}>שמירה</Button>
            <Button variant="ghost" onClick={resetEditor}>
              ביטול
            </Button>
          </div>
        </Card>
      )}

      {view === 'ai' && (
        <div className="max-w-2xl">
          <PersonaBuilderWizard
            initial={aiInitial}
            onComplete={handleAiComplete}
            onCancel={resetEditor}
            submitLabel={isEditing ? 'עדכון פרסונה' : 'שמירת פרסונה'}
          />
        </div>
      )}
    </div>
  );
}
