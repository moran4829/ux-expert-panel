#!/usr/bin/env node
/**
 * Updates admin email in Firebase rules files.
 * Usage: node scripts/set-admin-email.mjs your@gmail.com
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/set-admin-email.mjs your@gmail.com');
  process.exit(1);
}

const files = [
  path.join(root, 'firebase/firestore.rules'),
  path.join(root, 'firebase/storage.rules'),
];

const placeholder = 'YOUR_ADMIN_EMAIL@gmail.com';
const quoted = `'${email}'`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(placeholder)) {
    content = content.replaceAll(placeholder, email);
  } else {
    content = content.replace(
      /request\.auth\.token\.email in \[\s*'[^']+'\s*\]/,
      `request.auth.token.email in [\n        ${quoted}\n      ]`
    );
  }
  fs.writeFileSync(file, content);
  console.log('Updated:', path.relative(root, file));
}

console.log(`Admin email set to: ${email}`);
console.log('Next: paste rules in Firebase Console OR run: npx firebase deploy --only firestore:rules,storage');
