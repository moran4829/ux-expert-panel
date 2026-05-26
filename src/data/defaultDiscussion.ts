import { DiscussionMessage } from '../types';

export type DiscussionMessageTemplate = Omit<DiscussionMessage, 'id' | 'timestamp'>;

export const DEFAULT_DISCUSSION_MESSAGES: DiscussionMessageTemplate[] = [
  { expertId: 'system', type: 'status', text: 'סורק את תהליך התשלום בכתובת example.co.il/checkout...' },
  {
    expertId: 'usability_nielsen',
    type: 'observation',
    text: 'מזהה תהליך של 3 שלבים. יש חוסר עקביות במיקום כפתור ה"הבא" בין שלב 1 לשלב 2.',
  },
  {
    expertId: 'marketing_cro',
    type: 'observation',
    text: 'אין שום הוכחה חברתית (Social Proof) בעמוד הסיכום. המשתמש מגיע לרגע התשלום ללא אישור נוסף שזו החלטה נכונה.',
  },
  {
    expertId: 'ux_don_norman',
    type: 'observation',
    text: 'טופס האשראי לא מספק משוב מיידי (Inline validation). המשתמש יגלה שסיסמת ה-CVV חסרה רק אחרי שינסה לשלוח.',
  },
  {
    expertId: 'accessibility_wcag',
    type: 'observation',
    text: 'צבע הטקסט של הודעת השגיאה הוא אדום בלבד ללא אייקון. משתמשים עיוורי צבעים יתקשו להבחין בכך.',
  },
  { expertId: 'system', type: 'status', text: 'מריץ סימולציית "משתמשת לחוצה בזמן"...' },
  {
    expertId: 'attention_cognitive_load',
    type: 'observation',
    text: 'המשתמשת הלחוצה נטשה בשלב 2. הוספתם כפתור "קופון" מודגש מדי שלקח את תשומת הלב מהפעולה המרכזית (לשלם).',
  },
  {
    expertId: 'marketing_cro',
    type: 'observation',
    text: 'דווקא תיבת הקופון חיונית להמרה של קהל צעיר. אני ממליץ להשאיר אותה פתוחה.',
  },
  {
    expertId: 'simplicity_krug',
    type: 'conflict',
    text: 'אני לא מסכים. התיבה דורשת חשיבה. משתמשים עוזבים לחפש קופון בגוגל ולא חוזרים. עדיף להסתיר את התיבה מאחורי לינק טקסט רגיל.',
  },
];
