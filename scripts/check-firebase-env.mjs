#!/usr/bin/env node
/**
 * Fails the build if Firebase client env vars are missing (e.g. on Vercel).
 * Vite embeds VITE_* at build time — they must be set in the host dashboard.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

if (missing.length === 0) {
  console.log('Firebase env: OK');
  process.exit(0);
}

console.error('\n❌ Firebase env missing — login will not work in production.\n');
console.error('Missing variables:\n  ' + missing.join('\n  '));
console.error(`
Add them in Vercel:
  Project → Settings → Environment Variables → Production (+ Preview)

Copy values from your local .env.local (Firebase Console → Project settings → Web app).

Also set:
  VITE_ADMIN_EMAILS=your@email.com
  GEMINI_API_KEY=...   (server — for admin LLM on Vercel)

Then redeploy (Deployments → ⋯ → Redeploy) — VITE_* are baked in at build time.

Firebase Console → Authentication → Settings → Authorized domains:
  add your-app.vercel.app and custom domain.
`);
process.exit(1);
