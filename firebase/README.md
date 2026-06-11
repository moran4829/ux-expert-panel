# Firebase setup for Podium

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in `VITE_FIREBASE_*` from Firebase Console.

Set `VITE_ADMIN_EMAILS` to your Google email(s), comma-separated.

## 2. Deploy security rules

In Firebase Console → Firestore → Rules, paste `firebase/firestore.rules`.

**Important:** Replace `YOUR_ADMIN_EMAIL@gmail.com` with your real admin email(s).

Storage → Rules: paste `firebase/storage.rules` (same email replacement).

## 3. Firestore indexes

When admin opens "כל הבדיקות", Firebase may ask for a **collection group index** on `projects`.
Click the link in the browser console error to create it automatically.

## 4. Authorized domains

Authentication → Settings → Authorized domains:
- `localhost`
- Your Vercel domain

## 5. Vercel

Add the same `VITE_*` variables in Vercel → Settings → Environment Variables.
