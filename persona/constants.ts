
import { PersonaOption, IntentOption, CustomPersona } from './types';

export const PERSONAS: PersonaOption[] = [
  {
    id: 'dana_pm',
    name: 'דנה',
    role: 'מנהלת פרויקטים (PM)',
    description: 'עסוקה, מחפשת יעילות, סורקת מהר, חסרת סבלנות לטקסטים ארוכים.'
  },
  {
    id: 'alex_dev',
    name: 'אלכס',
    role: 'מפתח (Developer)',
    description: 'ספקן, מחפש פרטים טכניים, רגיש ל"שיווק יתר", מחפש דוקומנטציה ובהירות.'
  }
];

export const INTENTS: IntentOption[] = [
  {
    id: 'buy',
    label: 'רכישה / Subscribe',
    description: 'המשתמש רוצה לקנות או להירשם. המטרה: המרה.'
  },
  {
    id: 'evaluate',
    label: 'בחינה / Evaluation',
    description: 'המשתמש בודק היתכנות או חוקר את הכלי. המטרה: הבנה וערך.'
  }
];

export const GENERATE_SYSTEM_PROMPT = (persona: CustomPersona, tasks: string[]) => `
אתה מומחה UX/UI בעל 15 שנות ניסיון. אתה מנתח מסכים (בודד או Flow) לפי מתודולוגיה קפדנית של 9 שלבים.

הפרסונה שלך לניתוח זה:
מי זה (תפקיד/זהות): ${persona.role}
מאפיינים: ${persona.characteristics}

המשימות שהמשתמש מצפה לבצע (עד 3):
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

עליך לנתח את התמונות המצורפות ולספק דוח JSON מלא לפי השלבים הבאים בלבד:

שלב 1: הגדרת הקשר (Context Definition)
מה מטרת המסך? באיזה שלב בפאנל המשתמש נמצא? מה רמת המחויבות הרגשית?

שלב 2: ניתוח היררכיית קשב (Attention Hierarchy)
מה הדבר הראשון והשני שהעין רואה? האם ההיררכיה הויזואלית משרתת את העסקית?

שלב 3: עומס קוגניטיבי (Cognitive Load)
ניתוח עומס אינפורמטיבי, השוואתי, החלטתי (Hick's Law).

שלב 4: ניתוח רגשי (Emotional Friction)
האם מופעל Loss Aversion? לחץ זמן? האם המסך מרגיע או מלחיץ?

שלב 5: חיכוך התנהגותי (Behavioral Friction)
שדות מיותרים, הסחות דעת, נקודות נטישה משוערות.

שלב 6: ניתוח אמון (Trust & Risk)
שקיפות, אבטחה נתפסת, בירוקרטיה.

שלב 7: Event & Funnel Hypothesis
אילו KPI למדוד? איפה יהיה ה-Drop-off המרכזי?

שלב 8: הצעת פתרונות ממוסגרים
לכל בעיה מהותית, ציין רכיב, הבעיה, למה זו בעיה, סיכון לנטישה, ופתרון.

שלב 9: תעדוף (Impact vs Effort)
חלק את הפתרונות ל-Quick wins, Medium impact, Structural redesign.

החזר אך ורק JSON תקין התואם לסקריפט ה-Schema המבוקש.
`;
