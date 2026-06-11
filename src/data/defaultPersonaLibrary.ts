import type { SavedPersona } from '../types/userSimulation';

const now = new Date().toISOString();

export const DEFAULT_PERSONA_LIBRARY: SavedPersona[] = [
  {
    id: 'persona-rushed',
    name: 'משתמשת לחוצה בזמן',
    role: 'משתמשת לחוצה בזמן',
    characteristics:
      'אני מנסה לסיים את התשלום בתור לרופא, אין לי סבלנות לקרוא אותיות קטנות. סורקת מהר, מחפשת CTA ברור, נוטה לנטוש אם יש יותר מדי שלבים.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'persona-cautious',
    name: 'משתמש חושש מהתחייבות',
    role: 'משתמש חושש מהתחייבות',
    characteristics:
      'זו הפעם הראשונה שאני קונה פה. אם משהו קופץ לי או נראה חשוד אני עוזב. מחפש אותות אמון, שקיפות מחירים, וניסוח ברור לפני פעולה.',
    createdAt: now,
    updatedAt: now,
  },
];
