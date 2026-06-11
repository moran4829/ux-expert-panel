/** ברירות מחדל לשדות בחירה בוויזארד — ניתן לערוך גם כאן בקוד */
export interface WizardFieldOptions {
  domains: string[];
  stages: string[];
  targetAudiences: string[];
}

export const DEFAULT_WIZARD_FIELD_OPTIONS: WizardFieldOptions = {
  domains: [
    'מסחר אלקטרוני',
    'ביטוח',
    'בנקאות ופיננסים',
    'הלת\'-טק',
    'ממשל ושלטון מקומי',
    'מערכת פנימית למוקדנים',
  ],
  stages: ['אתר חי', 'לפני השקה (Staging)', 'אפיון ראשוני', 'שלב עיצוב'],
  targetAudiences: [
    'לקוחות קיימים וחדשים, גיל 25–60',
    'משתמשים מקצועיים / B2B',
    'קהל רחב — אוריינות דיגיטלית בינונית',
    'משתמשים מבוגרים — נגישות גבוהה',
  ],
};

export type WizardOptionField = keyof WizardFieldOptions;

export const WIZARD_OPTION_FIELD_LABELS: Record<WizardOptionField, string> = {
  domains: 'תחום המוצר',
  stages: 'שלב חיי המוצר',
  targetAudiences: 'קהל יעד (תבניות)',
};

export function normalizeWizardFieldOptions(
  saved: Partial<WizardFieldOptions> | null | undefined
): WizardFieldOptions {
  const uniq = (items: string[] | undefined, fallback: string[]) => {
    const merged = [...(items ?? []), ...fallback];
    return [...new Set(merged.map((s) => s.trim()).filter(Boolean))];
  };

  return {
    domains: uniq(saved?.domains, DEFAULT_WIZARD_FIELD_OPTIONS.domains),
    stages: uniq(saved?.stages, DEFAULT_WIZARD_FIELD_OPTIONS.stages),
    targetAudiences: uniq(saved?.targetAudiences, DEFAULT_WIZARD_FIELD_OPTIONS.targetAudiences),
  };
}
