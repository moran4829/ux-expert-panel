import React, { useEffect, useRef, useState } from 'react';
import {
  useAppContext,
  getExpertEditableFields,
  buildExpertSkillMarkdown,
} from '../../AppContext';
import { ExpertEditableFields } from '../../types';
import { DEFAULT_EXPERTS } from '../../data/experts';
import { LlmSettingsCard } from './LlmSettingsCard';
import { DEFAULT_LLM_SETTINGS } from '../../lib/llmDefaults';
import { getDefaultExpertAssetFields } from '../../lib/expertDefaults';
import {
  compressAvatarImage,
  downloadExpertSkill,
  parseExpertSkillMarkdown,
  readSkillFile,
} from '../../lib/expertSkill';
import { exportAppData as downloadJson } from '../../lib/storage';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';
import { CheckIcon, DownloadIcon, UploadIcon, DocumentIcon } from '../../components/icons';
import { cn } from '../../lib/utils';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
      {children}
    </label>
  );
}

type ExpertEditorCardProps = {
  expertId: string;
  initialFields: ExpertEditableFields;
  onSave: (fields: ExpertEditableFields) => Promise<{ skillSync?: string }>;
  onReset: () => Promise<void>;
};

function ExpertEditorCard({
  expertId,
  initialFields,
  onSave,
  onReset,
}: ExpertEditorCardProps) {
  const { experts } = useAppContext();
  const expert = experts.find((item) => item.id === expertId)!;
  const defaultExpert = DEFAULT_EXPERTS.find((item) => item.id === expertId)!;

  const [draft, setDraft] = useState<ExpertEditableFields>(initialFields);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSkillPreview, setShowSkillPreview] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const focusAreasText = draft.focusAreas.join('\n');

  useEffect(() => {
    setDraft(initialFields);
  }, [
    expertId,
    initialFields.name,
    initialFields.role,
    initialFields.archetype,
    initialFields.description,
    initialFields.avatar,
    initialFields.avatarBg,
    initialFields.skillExtra,
    initialFields.focusAreas.join('|'),
  ]);

  const previewExpert = { ...expert, ...draft, focusAreas: draft.focusAreas };
  const generatedSkill = buildExpertSkillMarkdown(previewExpert, draft.skillExtra);

  const handleSave = async () => {
    const focusAreas = focusAreasText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const fields: ExpertEditableFields = {
      ...draft,
      focusAreas: focusAreas.length > 0 ? focusAreas : draft.focusAreas,
    };

    const result = await onSave(fields);
    setDraft(fields);
    setSaved(true);
    setStatusMessage(result.skillSync ?? 'נשמר');
    setTimeout(() => {
      setSaved(false);
      setStatusMessage(null);
    }, 3000);
  };

  const handleReset = async () => {
    await onReset();
    setDraft({
      ...getExpertEditableFields(defaultExpert),
      ...getDefaultExpertAssetFields(expertId),
      skillExtra: '',
    });
    setStatusMessage('אופס לברירת מחדל');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressAvatarImage(file);
      setDraft((prev) => ({ ...prev, avatar: dataUrl }));
      setStatusMessage('תמונה עודכנה — לחצו שמירה');
    } catch {
      setStatusMessage('שגיאה בטעינת התמונה');
    }
    event.target.value = '';
  };

  const handleSkillUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readSkillFile(file);
      const parsed = parseExpertSkillMarkdown(content);
      setDraft((prev) => ({
        ...prev,
        ...parsed,
        focusAreas: parsed.focusAreas ?? prev.focusAreas,
      }));
      setStatusMessage('Skill נטען — בדקו ולחצו שמירה');
    } catch {
      setStatusMessage('שגיאה בקריאת קובץ Skill');
    }
    event.target.value = '';
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-[var(--color-podium-border)]">
        <ExpertAvatar expert={previewExpert} size={64} className="border border-[var(--color-podium-border)]" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--color-podium-text)]">{draft.name}</h3>
          <p className="text-sm text-[var(--color-podium-primary)] font-semibold">{draft.role}</p>
          <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1 font-mono">{expertId}</p>
        </div>
        {statusMessage && (
          <span className="text-xs font-semibold text-[var(--color-podium-info)] bg-[var(--color-podium-info-bg)] px-2 py-1 rounded-full max-w-[160px] text-center">
            {statusMessage}
          </span>
        )}
      </div>

      <div className="mb-5 p-4 rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-surface-muted)] border border-[var(--color-podium-border)]">
        <FieldLabel>תמונת מומחה</FieldLabel>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Button variant="secondary" size="sm" onClick={() => avatarInputRef.current?.click()}>
            העלאת תמונה
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                ...getDefaultExpertAssetFields(expertId),
              }))
            }
          >
            איפוס תמונה
          </Button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="flex items-center gap-2 mr-auto">
            <FieldLabel>צבע רקע</FieldLabel>
            <input
              type="color"
              value={draft.avatarBg ?? '#b6e3f4'}
              onChange={(e) => setDraft((prev) => ({ ...prev, avatarBg: e.target.value }))}
              className="w-10 h-10 rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>שם המומחה</FieldLabel>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <FieldLabel>תפקיד</FieldLabel>
          <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>אסכולה / Archetype</FieldLabel>
          <Input
            value={draft.archetype}
            onChange={(e) => setDraft({ ...draft, archetype: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>תיאור / הוראות למומחה</FieldLabel>
          <Textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>תחומי מיקוד (שורה לכל תחום)</FieldLabel>
          <Textarea
            rows={3}
            value={focusAreasText}
            onChange={(e) =>
              setDraft({
                ...draft,
                focusAreas: e.target.value.split('\n').map((line) => line.trim()),
              })
            }
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>הנחיות נוספות ל-Skill (אופציונלי)</FieldLabel>
          <Textarea
            rows={3}
            value={draft.skillExtra ?? ''}
            onChange={(e) => setDraft({ ...draft, skillExtra: e.target.value })}
            placeholder="טקסט שיתווסף לקובץ SKILL.md תחת Additional Guidelines"
          />
        </div>
      </div>

      <div className="mt-5 p-4 rounded-[var(--radius-podium-lg)] border border-[var(--color-podium-border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="font-bold text-sm text-[var(--color-podium-text)]">Skill של המומחה</h4>
            <p className="text-xs text-[var(--color-podium-text-secondary)]">
              כל שינוי כאן מתעדכן בקובץ `.cursor/skills/` בעת שמירה
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => skillInputRef.current?.click()}>
              העלאת SKILL.md
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<DownloadIcon size={14} />}
              onClick={() => downloadExpertSkill(previewExpert, draft.skillExtra)}
            >
              הורדת SKILL
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSkillPreview((v) => !v)}>
              {showSkillPreview ? 'הסתר תצוגה' : 'תצוגת SKILL'}
            </Button>
            <input
              ref={skillInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={handleSkillUpload}
            />
          </div>
        </div>
        {showSkillPreview && (
          <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-[var(--color-podium-surface-muted)] p-4 rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] max-h-64 overflow-auto font-mono text-left dir-ltr">
            {generatedSkill}
          </pre>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-podium-border)]">
        <Button onClick={handleSave} icon={<CheckIcon size={16} />}>
          {saved ? 'נשמר!' : 'שמירה + סנכרון Skill'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          איפוס לברירת מחדל
        </Button>
      </div>
    </Card>
  );
}

export function Settings() {
  const {
    experts,
    expertOverrides,
    updateExpert,
    resetExpert,
    resetAllExperts,
    syncAllSkills,
    exportAppData,
    importAppData,
  } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleExport = () => {
    downloadJson(exportAppData(), `uxpert-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importAppData({
          projects: Array.isArray(data.projects) ? data.projects : undefined,
          expertOverrides:
            data.expertOverrides && typeof data.expertOverrides === 'object'
              ? data.expertOverrides
              : undefined,
          llmSettings:
            data.llmSettings && typeof data.llmSettings === 'object'
              ? { ...DEFAULT_LLM_SETTINGS, ...data.llmSettings }
              : undefined,
        });
        setImportMessage('הנתונים יובאו בהצלחה');
      } catch {
        setImportMessage('שגיאה בקריאת הקובץ');
      }
      setTimeout(() => setImportMessage(null), 3000);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSyncAllSkills = async () => {
    const result = await syncAllSkills();
    setSyncMessage(result.message);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">הגדרות מערכת</h1>
        <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
          עריכת מומחים, תמונות ו-Skills. כל שמירה מעדכנת את קבצי SKILL ב-`.cursor/skills/`.
        </p>
      </header>

      <LlmSettingsCard />

      <Card padding="lg">
        <h2 className="font-bold text-[var(--color-podium-text)] mb-1">גיבוי, ייבוא וסנכרון Skills</h2>
        <p className="text-sm text-[var(--color-podium-text-secondary)] mb-4">
          הנתונים נשמרים ב-localStorage. Skills נכתבים לתיקיית הפרויקט ומשמשים את Cursor Agent.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon={<DownloadIcon size={16} />} onClick={handleExport}>
            ייצוא JSON
          </Button>
          <Button
            variant="secondary"
            icon={<UploadIcon size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            ייבוא JSON
          </Button>
          <Button variant="primary" icon={<DocumentIcon size={16} />} onClick={handleSyncAllSkills}>
            סנכרון כל ה-Skills
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
          {importMessage && (
            <span
              className={cn(
                'text-sm font-semibold',
                importMessage.includes('שגיאה')
                  ? 'text-[var(--color-podium-danger)]'
                  : 'text-[var(--color-podium-success)]'
              )}
            >
              {importMessage}
            </span>
          )}
          {syncMessage && (
            <span
              className={cn(
                'text-sm font-semibold',
                syncMessage.includes('שגיאה') || syncMessage.includes('לא ניתן')
                  ? 'text-[var(--color-podium-danger)]'
                  : 'text-[var(--color-podium-success)]'
              )}
            >
              {syncMessage}
            </span>
          )}
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">מומחים ({experts.length})</h2>
            <p className="text-sm text-[var(--color-podium-text-secondary)]">
              ערכו תוכן, תמונה ו-Skill — השינויים משפיעים על המערכת ועל Cursor
            </p>
          </div>
          <Button variant="ghost" onClick={() => resetAllExperts()}>
            איפוס כל המומחים
          </Button>
        </div>

        <div className="space-y-5">
          {experts.map((expert) => (
            <div key={expert.id}>
              <ExpertEditorCard
                expertId={expert.id}
                initialFields={getExpertEditableFields(expert, expertOverrides)}
                onSave={(fields) => updateExpert(expert.id, fields)}
                onReset={() => resetExpert(expert.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
