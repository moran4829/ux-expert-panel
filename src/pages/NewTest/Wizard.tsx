import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  deriveProjectName,
  isHttpUrl,
  resolveTestMaterial,
  wizardHasMaterialInput,
} from '../../lib/testMaterial';
import type { TestMaterial } from '../../types/material';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  UploadIcon,
  LinkIcon,
  MonitorIcon,
  DocumentIcon,
  PrototypeIcon,
  ImageIcon,
} from '../../components/icons';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';

type Step = 1 | 2 | 3 | 4;

export function Wizard() {
  const { navigate, setProjects, setCurrentProjectId, experts } = useAppContext();
  const [step, setStep] = useState<Step>(1);

  const [formData, setFormData] = useState({
    name: '',
    testType: 'live_site',
    url: '',
    domain: '',
    goal: '',
    stage: '',
    targetAudience: '',
    selectedExperts: ['ux_don_norman', 'simplicity_krug', 'marketing_cro'] as string[],
  });
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [materialPreview, setMaterialPreview] = useState<TestMaterial | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [prepareStatus, setPrepareStatus] = useState<string | null>(null);

  const handleNext = async () => {
    if (step === 1) {
      if (!wizardHasMaterialInput(formData.url, uploadedFiles)) {
        setMaterialError('יש להזין קישור (https://) או להעלות תמונה/סרטון — הניתוח מבוסס על החומר שהעליתם.');
        return;
      }
      setMaterialError(null);
    }

    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }

    setStep(4);
    setPrepareError(null);
    setPrepareStatus('מכין חומרים לניתוח...');

    try {
      const material = await resolveTestMaterial(formData.testType, formData.url, uploadedFiles);
      setMaterialPreview(material);
      setPrepareStatus(
        material.imageDataUrl
          ? 'חומר ויזואלי נטען — המומחים ינתחו את התמונה/המסך'
          : material.sourceUrl
            ? 'מטא-דאטה מהקישור נאספה'
            : 'הקשר טקסטואלי מוכן'
      );

      const displayUrl =
        material.sourceUrl ?? (isHttpUrl(formData.url) ? formData.url : material.fileNames?.join(', '));

      const projectName =
        formData.name.trim() || deriveProjectName(material, formData.url);

      const newProj = {
        id: 'proj-' + Date.now(),
        ...formData,
        name: projectName,
        url: displayUrl,
        material,
        reviewKind: 'expert' as const,
        userTestingEnabled: false,
        testType: formData.testType as 'live_site' | 'static_design' | 'prototype' | 'prd',
        status: 'running' as const,
        createdAt: new Date().toISOString(),
      };

      setTimeout(() => {
        setProjects((p) => [newProj, ...p]);
        setCurrentProjectId(newProj.id);
        navigate('discussion');
      }, 1500);
    } catch (error) {
      setPrepareError(error instanceof Error ? error.message : 'שגיאה בהכנת החומרים');
      setPrepareStatus(null);
    }
  };

  if (step === 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--color-podium-primary-light)] border-t-[var(--color-podium-primary)] animate-spin" />
          <MonitorIcon className="text-[var(--color-podium-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={40} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-podium-text)]">הצוות מתכנס...</h2>
          <p className="text-[var(--color-podium-text-secondary)] mt-2 text-sm">
            {prepareStatus ?? 'סורק חומרים, טוען פרסונות, ומחלק משימות למומחים.'}
          </p>
          {prepareError && (
            <p className="text-[var(--color-podium-danger)] text-sm font-semibold mt-2">{prepareError}</p>
          )}
          {materialPreview?.imageDataUrl && !prepareError && (
            <p className="text-[var(--color-podium-success)] text-xs mt-1">תמונה/מסך יישלחו למודל הראייה</p>
          )}
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'חומרים' },
    { num: 2, label: 'הקשר עסקי' },
    { num: 3, label: 'צוות מומחים' },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">בדיקת מומחים</h1>
        <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
          הגדירו חומרים, הקשר עסקי, והרכיבו את צוות המומחים לדיון.
        </p>

        <div className="flex items-center gap-2 mt-8">
          {steps.map((s, i, arr) => (
            <React.Fragment key={s.num}>
              <div className={cn('flex flex-col items-center', step === s.num ? 'opacity-100' : step > s.num ? 'opacity-100' : 'opacity-40')}>
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors',
                    step === s.num
                      ? 'bg-[var(--color-podium-primary)] text-white shadow-[var(--shadow-podium-sm)] ring-4 ring-[var(--color-podium-primary-light)]'
                      : step > s.num
                        ? 'bg-[var(--color-podium-success)] text-white'
                        : 'bg-[var(--color-podium-border)] text-[var(--color-podium-text-tertiary)]'
                  )}
                >
                  {step > s.num ? <CheckIcon size={16} /> : s.num}
                </div>
                <span className="text-xs font-semibold mt-2 text-[var(--color-podium-text-secondary)]">{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={cn('flex-1 h-0.5 rounded-full mb-6 mx-2 transition-colors', step > s.num ? 'bg-[var(--color-podium-success)]' : 'bg-[var(--color-podium-border)]')} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">מה אנחנו בודקים היום?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['live_site', 'static_design', 'prototype', 'prd'].map((type) => {
                const labels: Record<string, string> = {
                  live_site: 'אתר חי',
                  static_design: 'עיצוב סטטי',
                  prototype: 'אבטיפוס',
                  prd: 'מסמך דרישות',
                };
                const icons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
                  live_site: MonitorIcon,
                  static_design: ImageIcon,
                  prototype: PrototypeIcon,
                  prd: DocumentIcon,
                };
                const TypeIcon = icons[type];
                const isSelected = formData.testType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, testType: type })}
                    className={cn(
                      'p-4 rounded-[var(--radius-podium-lg)] border-2 text-center transition-all flex flex-col items-center justify-center gap-2.5',
                      isSelected
                        ? 'border-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)] font-bold'
                        : 'border-[var(--color-podium-border)] bg-white text-[var(--color-podium-text-secondary)] hover:border-[var(--color-podium-primary)]/30 hover:bg-[var(--color-podium-surface-muted)]'
                    )}
                  >
                    <TypeIcon
                      className={isSelected ? 'text-[var(--color-podium-primary)]' : 'text-[var(--color-podium-text-tertiary)]'}
                      size={20}
                    />
                    <span className="text-sm">{labels[type]}</span>
                  </button>
                );
              })}
            </div>

            <Card className="space-y-4">
              <label className="block text-sm font-semibold text-[var(--color-podium-text)]">קישור לאתר או לפרוטוטייפ</label>
              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="flex-1">
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    icon={<LinkIcon size={16} />}
                    className="text-left dir-ltr pr-10"
                    placeholder="https://"
                  />
                </div>
                <label className="bg-[var(--color-podium-surface-muted)] hover:bg-[var(--color-podium-border)] text-[var(--color-podium-text)] px-5 py-2.5 cursor-pointer font-semibold rounded-[var(--radius-podium-lg)] flex items-center justify-center gap-2 transition-colors border border-[var(--color-podium-border)] text-sm">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.png,.jpg,.jpeg,.webp,.mp4,.webm"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length > 0) {
                        setUploadedFiles(files);
                        setFormData({
                          ...formData,
                          url: files.map((f: File) => f.name).join(', '),
                        });
                      }
                    }}
                  />
                  <UploadIcon size={16} /> העלאת תמונה / סרטון
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <p className="text-xs text-[var(--color-podium-text-secondary)]">
                  קבצים: {uploadedFiles.map((f) => f.name).join(', ')} — יועלו ויישלחו לניתוח ויזואלי (תמונה או פריים
                  מסרטון).
                </p>
              )}
              <p className="text-xs text-[var(--color-podium-text-tertiary)]">
                הניתוח מבוסס על החומר שהעליתם — לא על תרחיש דמו. קישור נסרק בשרת; תמונה/וידאו נשלחים למודל הראייה.
              </p>
              {materialError && (
                <p className="text-sm text-[var(--color-podium-danger)] font-semibold">{materialError}</p>
              )}
            </Card>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--color-podium-text)]">
                שם הבדיקה (אופציונלי — ייווצר אוטומטית מהחומר)
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="למשל: בדיקת דף נחיתה"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)]">הקשר עסקי (אופציונלי)</h2>
            <p className="text-sm text-[var(--color-podium-text-secondary)] -mt-4">
              השדות כאן לא מחליפים את החומר שהעליתם — המומחים מנתחים את המוצר/מסך עצמו. מלאו רק אם רלוונטי.
            </p>

            <Card className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--color-podium-text)]">תחום המוצר</label>
                <Select value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}>
                  <option value="">— לא צוין —</option>
                  <option>מסחר אלקטרוני</option>
                  <option>ביטוח</option>
                  <option>בנקאות ופיננסים</option>
                  <option>הלת'-טק</option>
                  <option>ממשל ושלטון מקומי</option>
                  <option>מערכת פנימית למוקדנים</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--color-podium-text)]">שלב חיי המוצר</label>
                <Select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })}>
                  <option value="">— לא צוין —</option>
                  <option>אתר חי</option>
                  <option>לפני השקה (Staging)</option>
                  <option>אפיון ראשוני</option>
                  <option>שלב עיצוב</option>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--color-podium-text)]">מטרת הבדיקה</label>
                <Textarea
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="מה אנחנו מנסים למצוא בבדיקה הזו?"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--color-podium-text)]">קהל יעד (מי המשתמשים?)</label>
                <Textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="min-h-[80px]"
                  placeholder="גיל, רקע, אוריינות דיגיטלית..."
                />
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-podium-text)]">בחירת מומחים לצוות</h2>
              <Badge variant="primary">{formData.selectedExperts.length} מומחים נבחרו</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experts.map((expert) => {
                const isSelected = formData.selectedExperts.includes(expert.id);
                return (
                  <div
                    key={expert.id}
                    onClick={() => {
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          selectedExperts: formData.selectedExperts.filter((id) => id !== expert.id),
                        });
                      } else {
                        setFormData({ ...formData, selectedExperts: [...formData.selectedExperts, expert.id] });
                      }
                    }}
                    className={cn(
                      'flex items-start gap-4 p-5 rounded-[var(--radius-podium-lg)] border-2 transition-all cursor-pointer relative overflow-hidden bg-white',
                      isSelected
                        ? 'border-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)]/50 shadow-[var(--shadow-podium-sm)]'
                        : 'border-[var(--color-podium-border)] hover:border-[var(--color-podium-border-strong)]'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-10 h-10 bg-[var(--color-podium-primary)] flex items-start justify-end rounded-bl-2xl">
                        <CheckIcon className="text-white mr-2 mt-2" size={16} />
                      </div>
                    )}

                    <ExpertAvatar
                      expert={expert}
                      size={56}
                      className="border border-[var(--color-podium-border)]"
                    />

                    <div>
                      <h3 className="font-bold text-[var(--color-podium-text)] leading-tight">{expert.name}</h3>
                      <p className="text-sm text-[var(--color-podium-primary)] font-semibold mb-1.5">{expert.role}</p>
                      <p className="text-sm text-[var(--color-podium-text-secondary)] leading-snug line-clamp-2 md:line-clamp-none">
                        {expert.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[var(--color-podium-border)] p-4 md:px-8 shadow-[var(--shadow-podium-sm)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step > 1 ? setStep((s) => (s - 1) as Step) : navigate('dashboard'))}
            icon={<ChevronRightIcon size={16} />}
            iconPosition="start"
          >
            {step === 1 ? 'חזרה לעמוד הבית' : 'הקודם'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={
              (step === 1 && !wizardHasMaterialInput(formData.url, uploadedFiles)) ||
              (step === 3 && formData.selectedExperts.length === 0)
            }
            variant={step === 3 ? 'success' : 'primary'}
            icon={step !== 3 ? <ChevronLeftIcon size={16} /> : undefined}
          >
            {step === 3 ? 'הרץ בדיקת מומחים' : 'המשך'}
          </Button>
        </div>
      </div>
    </div>
  );
}
