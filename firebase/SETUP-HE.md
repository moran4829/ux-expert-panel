# Firebase — הגדרה (אימייל + סיסמה)

## Firebase Console (פעם אחת)

1. **Authentication** → **Sign-in method**
2. **Email/Password** → **Enable**
3. באותו מסך — הפעילי גם **Email link (passwordless sign-in)**
4. (Google — **לא חובה**, אפשר להשאיר כבוי)

5. **Authorized domains** — ודאי ש-`localhost` ודומיין הפרודקשן רשומים:
   - `your-project.vercel.app`
   - דומיין מותאם אישית (אם יש)
6. **Firestore Database** — Create database (אם עדיין לא)
7. **Rules** — העתיקי `firebase/firestore.rules` → Publish

**Storage — לא נדרש.**

---

## מקומי

`.env.local` עם `VITE_FIREBASE_*` — העתיקי מ-Firebase Console → Project settings → Your apps → Web.

```bash
npm run setup:env   # או ידנית
npm run dev
```

---

## Vercel (חובה לפרודקשן)

`.env.local` **לא** עולה ל-Git ו**לא** מגיע ל-Vercel אוטומטית.  
משתנים שמתחילים ב-`VITE_` נטמעים **בזמן build** — חייבים להגדיר אותם ב-Vercel **לפני** deploy.

### שלב 1 — Environment Variables

Vercel → הפרויקט → **Settings** → **Environment Variables**

הוסיפי (העתיקי את הערכים **מ-.env.local** המקומי שלך):

| משתנה | סביבות |
|--------|--------|
| `VITE_FIREBASE_API_KEY` | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | Production, Preview, Development |
| `VITE_ADMIN_EMAILS` | Production, Preview, Development |
| `GEMINI_API_KEY` | Production, Preview (מפתח שרת — LLM של האדמין) |

### שלב 2 — Redeploy

אחרי שמירת המשתנים: **Deployments** → הדיפלוי האחרון → **⋯** → **Redeploy**  
(בלי redeploy ה-build הישן נשאר בלי Firebase)

### שלב 3 — Authorized domains

Firebase Console → Authentication → Settings → **Authorized domains**  
→ הוסיפי את כתובת האתר ב-Vercel (למשל `ux-expert-panel.vercel.app`).

### אבחון

- מסך «Firebase לא מוגדר» = חסרים `VITE_FIREBASE_*` ב-build
- `npm run prebuild` מקומית בודק שהמשתנים קיימים
- ב-Vercel, אם חסר משהו — ה-build ייכשל עם רשימת משתנים חסרים

---

## שימוש

- **התחברות / הרשמה** — אימייל + סיסמה, או **קישור חד-פעמי במייל**
- **Admin** — `VITE_ADMIN_EMAILS`
- **משתמשים אחרים** — מגדירים מפתח Gemini / LLM משלהם בכניסה
