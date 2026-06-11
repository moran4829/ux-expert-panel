# Firebase — הגדרה (אימייל + סיסמה)

## Firebase Console (פעם אחת)

1. **Authentication** → **Sign-in method**
2. **Email/Password** → **Enable**
3. באותו מסך — הפעילי גם **Email link (passwordless sign-in)**
4. (Google — **לא חובה**, אפשר להשאיר כבוי)

5. **Authorized domains** — ודאי ש-`localhost` ודומיין הפרודקשן רשומים
6. **Firestore Database** — Create database (אם עדיין לא)
7. **Rules** — העתיקי `firebase/firestore.rules` → Publish

**Storage — לא נדרש.**

---

## מקומי

`.env.local` עם `VITE_FIREBASE_*` — כבר מוגדר.

```bash
npm run dev
```

## שימוש

- **התחברות / הרשמה** — אימייל + סיסמה, או **קישור חד-פעמי במייל** (ללא סיסמה)
- **Admin** — `VITE_ADMIN_EMAILS` ב-.env.local

---

## Vercel

הוסיפי משתני `VITE_FIREBASE_*` + `VITE_ADMIN_EMAILS`
