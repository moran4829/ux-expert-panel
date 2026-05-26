import { Expert, ExpertContent, ExpertOverrides } from '../types';

import avatarAccessibilityWcag from '../assets/avatar_accessibility_wcag.png';
import avatarArtDirector from '../assets/avatar_art director.png';
import avatarAttentionCognitiveLoad from '../assets/avatar_attention_cognitive_load.png';
import avatarBehavioralEconomics from '../assets/avatar_behavioral_economics.png';
import avatarBusinessDomain from '../assets/avatar_business_domain.png';
import avatarInteractionPsychology from '../assets/avatar_interaction_psychology.png';
import avatarMarketing from '../assets/avatar_marketing.png';
import avatarUsabilityNielsen from '../assets/avatar_usability_nielsen.png';
import avatarSimplicityKrug from '../assets/simplicity_krug.png';

const avatarDonNorman = new URL('../assets/avatar_\u00a0ux_don_norman.png', import.meta.url).href;

export const DEFAULT_EXPERTS: Expert[] = [
  {
    id: 'ux_don_norman',
    name: 'דון השכל',
    archetype: 'אסכולת Don Norman',
    role: 'מודל מנטלי וציפיות',
    avatar: avatarDonNorman,
    avatarBg: '#b6e3f4',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'בוחן האם המוצר מובן, טבעי, צפוי ומתאים למודל המנטלי של המשתמש. מתמקד במשוב (feedback) ורמזים חזותיים (affordances).',
    focusAreas: ['זרימה טבעית', 'שליטה וביטחון', 'מניעת טעויות']
  },
  {
    id: 'usability_nielsen',
    name: 'יעקב היעיל',
    archetype: 'אסכולת Jakob Nielsen',
    role: 'שימושיות וסטנדרטים',
    avatar: avatarUsabilityNielsen,
    avatarBg: '#c0aede',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'בוחן את המוצר לפי 10 עקרונות השימושיות הקלאסיים. מחפש חוסר עקביות, עומס מידע, ובעיות בהתאוששות משגיאות.',
    focusAreas: ['עקביות', 'נראות מצב מערכת', 'זיהוי במקום זכירה']
  },
  {
    id: 'simplicity_krug',
    name: 'סטיב הפשוט',
    archetype: 'אסכולת Steve Krug',
    role: 'מניעת עומס קוגניטיבי',
    avatar: avatarSimplicityKrug,
    avatarBg: '#ffdfbf',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: "בוחן האם המשתמש יכול לבצע את המשימה בלי לחשוב יותר מדי (Don't make me think).",
    focusAreas: ['סריקה מהירה', 'פישוט תהליכים', 'הסרת מילים מיותרות']
  },
  {
    id: 'accessibility_wcag',
    name: 'שירה הנגישה',
    archetype: 'מומחית WCAG',
    role: 'נגישות והכלה',
    avatar: avatarAccessibilityWcag,
    avatarBg: '#c1f4c5',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'בוחנת האם המוצר נגיש לכלל המשתמשים (ראייה, קוגניציה, מוטוריקה). קוראת מסכים ובוחנת קונטרסט וניווט מקלדת.',
    focusAreas: ['ניגודיות צבעים', 'קוראי מסך', 'פוקוס מקלדת']
  },
  {
    id: 'art_director',
    name: 'איה האסתטית',
    archetype: 'Art Director',
    role: 'שפה ויזואלית ומותג',
    avatar: avatarArtDirector,
    avatarBg: '#ffd5dc',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    description: 'עין חדה לקומפוזיציה, טיפוגרפיה, היררכיה ואופי המותג. מוודאת שהעיצוב נראה אמין, הרמוני ומקצועי.',
    focusAreas: ['היררכיה ויזואלית', 'עקביות עיצובית', 'אמון ויזואלי']
  },
  {
    id: 'marketing_cro',
    name: 'מרק הממיר',
    archetype: 'מומחה שיווק ו-CRO',
    role: 'הנעה לפעולה והמרה',
    avatar: avatarMarketing,
    avatarBg: '#f4d8e8',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    description: 'מוודא שהמסר ברור, הצעת הערך משכנעת, והקריאות לפעולה מניעות משתמשים להתקדם במשפך.',
    focusAreas: ['הצעת ערך', 'טיפול בהתנגדויות', 'כפתורי הנעה לפעולה (CTA)']
  },
  {
    id: 'business_domain',
    name: 'דן העסקי',
    archetype: 'Business Analyst',
    role: 'הלימה עסקית',
    avatar: avatarBusinessDomain,
    avatarBg: '#d1d4f9',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    description: 'מתאים את עצמו לתחום (פיננסים, בריאות וכדומה) ובוחן רגולציה, התאמה ליעדים והזדמנויות upsell.',
    focusAreas: ['רגולציה', 'קפיצות מדרגה עסקיות', 'מדדי הצלחה']
  },
  {
    id: 'attention_cognitive_load',
    name: 'רועי הממוקד',
    archetype: 'מומחה קשב',
    role: 'סביבת שימוש אמיתית',
    avatar: avatarAttentionCognitiveLoad,
    avatarBg: '#fcf4b6',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'מנתח עומס קוגניטיבי, התאוששות מהפרעות, ויכולת חזרה למשימה כשהמשתמש מוסח או עמוס.',
    focusAreas: ['פירוק משימות', 'ניהול הסחות דעת', 'שמירת התקדמות']
  },
  {
    id: 'behavioral_economics',
    name: 'נועה ההתנהגותית',
    archetype: 'כלכלה התנהגותית',
    role: 'השפעה על בחירות',
    avatar: avatarBehavioralEconomics,
    avatarBg: '#bdf4e8',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    description: 'בוחנת הטיות קוגניטיביות, ברירות מחדל, שנאת הפסד וארכיטקטורת בחירה מתחת לפני השטח.',
    focusAreas: ['ברירות מחדל', 'עומס בחירה', 'בניית אמון']
  },
  {
    id: 'interaction_psychology',
    name: 'פרופ׳ רגש',
    archetype: 'פסיכולוגיה של ממשקים',
    role: 'חוויה רגשית',
    avatar: avatarInteractionPsychology,
    avatarBg: '#e6d5c3',
    color: 'bg-stone-100 text-stone-700 border-stone-200',
    description: 'מנתח חרדות מערכת: ממה המשתמש מפחד? איפה הוא מרגיש אבוד? ואיך הממשק מגיב אליו (תומך או שיפוטי).',
    focusAreas: ['תחושת שליטה', 'פחד מטעויות', 'טון דיבור אנושי']
  }
];

export const EXPERTS = DEFAULT_EXPERTS;

export function mergeExperts(defaults: Expert[], overrides: ExpertOverrides): Expert[] {
  return defaults.map((expert) => ({
    ...expert,
    ...(overrides[expert.id] ?? {}),
  }));
}

export function getExpertContent(expert: Expert): ExpertContent {
  return {
    name: expert.name,
    archetype: expert.archetype,
    role: expert.role,
    description: expert.description,
    focusAreas: [...expert.focusAreas],
  };
}
