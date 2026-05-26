import { Finding } from '../types';

export const DEFAULT_FINDINGS: Finding[] = [
  {
    id: 'f1',
    title: 'חוסר ודאות בשלב הסיכום ("האם התחייבתי?")',
    location: 'מסך סיום - לפני לחיצה על "סיום ושליחה"',
    description:
      'המשתמשים לא מבינים אם הלחיצה מחייבת אותם או שפירושה בקשת הצעה. זה יוצר פחד שמוריד יחס המרה סמוך לקו הסיום.',
    expertSources: ['behavioral_economics', 'interaction_psychology', 'marketing_cro'],
    severity: 'High',
    impact: 'נטישה גבוהה מאוד בשלב האחרון (הערכה: 15% נטישה).',
    effort: 'Low',
    recommendation: 'לשנות את הכפתור מ-"סיום ושליחה" ל-"קבלת הצעה למייל (ללא התחייבות)".',
    status: 'new',
  },
  {
    id: 'f2',
    title: 'ניגודיות נמוכה בהודעות שגיאה',
    location: 'כל טופס איסוף הפרטים',
    description:
      'הודעות שגיאה מוצגות בצבע אדום בלבד ללא אינדיקציה צורנית/אייקון, וניגודיות הצבע אינה עומדת בתקן AA.',
    expertSources: ['accessibility_wcag'],
    severity: 'Medium',
    impact: 'קשיים למשתמשים עם עיוורון צבעים או לקויות ראייה. עיכוב בהשלמת טפסים.',
    effort: 'Low',
    recommendation: 'להוסיף אייקון אזהרה (⚠️) ליד הטקסט, ולהכהות את האדום ל-#B30000.',
    status: 'new',
  },
  {
    id: 'f3',
    title: 'עומס בחירה במסלולי התמחור',
    location: 'מסך בחירת מסלול',
    description:
      '5 מסלולים שונים מוצגים בו זמנית עם הרבה טקסט. קשה להשוות ביניהם ואין "עיגון" או המלצת מערכת.',
    expertSources: ['simplicity_krug', 'behavioral_economics', 'attention_cognitive_load'],
    severity: 'High',
    impact: 'שיתוק בחירה (Choice Overload). משתמשים נוטשים כדי "לחשוב על זה".',
    effort: 'Medium',
    recommendation: 'לצמצם ל-3 מדרגות. לסמן אחת כ-"הבחירה הפופולרית" (ברירת מחדל חכמה).',
    status: 'new',
  },
];

export const DEFAULT_REPORT_SCORES: Record<string, number> = {
  overall: 72,
  clarity: 85,
  usability: 75,
  trust: 62,
  accessibility: 65,
};
