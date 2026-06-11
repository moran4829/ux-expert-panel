import hostIllustration from '../../assets/Defualt.svg';
import artDirectorImg from '../../assets/art director.png';
import accessibilityWcagImg from '../../assets/accessibility_wcag.png';
import attentionCognitiveLoadImg from '../../assets/attention_cognitive_load.png';
import businessDomainImg from '../../assets/business_domain.png';

export type LoginCharacter = {
  id: string;
  name: string;
  src: string;
  quote: string;
  role?: string;
  large?: boolean;
};

export const LOGIN_CHARACTERS: LoginCharacter[] = [
  {
    id: 'girl',
    name: 'פשוט לשבת ולהשען',
    src: hostIllustration,
    quote: 'ובינתיים — תני למומחים לעזור לך',
    large: true,
  },
  {
    id: 'art_director',
    name: 'איה האסתטית',
    src: artDirectorImg,
    quote: 'פרטים ויזואליים בונים אמון — או שוברים אותו.',
    role: 'שפה ויזואלית ומותג',
  },
  {
    id: 'accessibility_wcag',
    name: 'שירה הנגישה',
    src: accessibilityWcagImg,
    quote: 'מוצר טוב נגיש לכולם, בלי פשרות.',
    role: 'נגישות והכלה',
  },
  {
    id: 'attention_cognitive_load',
    name: 'רועי הממוקד',
    src: attentionCognitiveLoadImg,
    quote: 'פחות רעש, יותר התקדמות — גם כשחיים מפריעים.',
    role: 'סביבת שימוש אמיתית',
  },
  {
    id: 'business_domain',
    name: 'דן העסקי',
    src: businessDomainImg,
    quote: 'UX מצוין משרת את המשתמש ואת העסק.',
    role: 'הלימה עסקית',
  },
];

const STORAGE_KEY = 'podium_login_char_index';

export function pickLoginCharacterIndex(): number {
  if (typeof window === 'undefined' || LOGIN_CHARACTERS.length === 0) return 0;

  const last = Number.parseInt(window.sessionStorage.getItem(STORAGE_KEY) ?? '-1', 10);
  let next = Math.floor(Math.random() * LOGIN_CHARACTERS.length);

  if (LOGIN_CHARACTERS.length > 1) {
    let guard = 0;
    while (next === last && guard < 12) {
      next = Math.floor(Math.random() * LOGIN_CHARACTERS.length);
      guard += 1;
    }
  }

  window.sessionStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
