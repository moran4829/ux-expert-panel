export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'כתובת האימייל כבר רשומה. נסי להתחבר.';
    case 'auth/invalid-email':
      return 'כתובת אימייל לא תקינה.';
    case 'auth/weak-password':
      return 'הסיסמה חלשה מדי — לפחות 6 תווים.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'אימייל או סיסמה שגויים. אם נרשמתם בקישור מייל — השתמשו ב«קישור חד-פעמי», או «שכחתי סיסמה».';
    case 'auth/too-many-requests':
      return 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.';
    case 'auth/operation-not-allowed':
      return 'שיטת ההתחברות לא מופעלת. Firebase Console → Authentication → Email/Password → Enable + Email link';
    case 'auth/invalid-action-code':
      return 'הקישור לא תקין או כבר נוצל. בקשי קישור חדש.';
    case 'auth/expired-action-code':
      return 'פג תוקף הקישור. בקשי קישור חדש.';
    case 'auth/missing-email':
      return 'נדרש אימייל להשלמת ההתחברות.';
    case 'auth/network-request-failed':
      return 'בעיית רשת. בדקי חיבור לאינטרנט.';
    case 'auth/requires-recent-login':
      return 'נדרשת התחברות מחדש. הזיני את הסיסמה הנוכחית.';
    case 'auth/invalid-password':
      return 'הסיסמה הנוכחית שגויה.';
    case 'auth/invalid-profile-attribute':
      return 'לא ניתן לשמור את התמונה — נסי תמונה קטנה יותר.';
    default:
      return message || 'שגיאה. נסי שוב.';
  }
}
