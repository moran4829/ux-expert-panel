import { Expert, ExpertEditableFields } from '../types';

export function expertIdToSkillName(expertId: string): string {
  return expertId.replace(/_/g, '-');
}

export function buildExpertSkillMarkdown(expert: Expert, skillExtra?: string): string {
  const skillName = expertIdToSkillName(expert.id);
  const description = [
    `${expert.name} — ${expert.role}.`,
    expert.archetype,
    `Focus areas: ${expert.focusAreas.join(', ')}.`,
    `Use when a UX review needs the ${expert.name} perspective.`,
  ].join(' ');

  const extraBlock = skillExtra?.trim()
    ? `\n\n## Additional Guidelines\n${skillExtra.trim()}`
    : '';

  return `---
name: ${skillName}
description: ${description}
---

# ${expert.name}

## Role
${expert.role}

## Archetype
${expert.archetype}

## Focus Areas
${expert.focusAreas.map((area) => `- ${area}`).join('\n')}

## Instructions
${expert.description}${extraBlock}
`;
}

function parseFrontmatter(content: string): { name?: string; description?: string; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { body: content };

  const frontmatter = match[1];
  const body = match[2];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  return { name, description, body };
}

function parseSection(body: string, ...headers: string[]): string | undefined {
  for (const header of headers) {
    const regex = new RegExp(`##\\s+${header}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
    const match = body.match(regex);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

function parseFocusAreas(section?: string): string[] | undefined {
  if (!section) return undefined;
  const lines = section
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

export function parseExpertSkillMarkdown(content: string): Partial<ExpertEditableFields> {
  const { body } = parseFrontmatter(content);
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const role = parseSection(body, 'Role', 'תפקיד');
  const archetype = parseSection(body, 'Archetype', 'אסכולה');
  const focusAreas = parseFocusAreas(parseSection(body, 'Focus Areas', 'תחומי מיקוד'));
  const instructions = parseSection(body, 'Instructions', 'הוראות');
  const skillExtra = parseSection(body, 'Additional Guidelines', 'הנחיות נוספות');

  const result: Partial<ExpertEditableFields> = {};

  if (titleMatch?.[1]?.trim()) result.name = titleMatch[1].trim();
  if (role) result.role = role;
  if (archetype) result.archetype = archetype;
  if (focusAreas) result.focusAreas = focusAreas;
  if (instructions) result.description = instructions;
  if (skillExtra) result.skillExtra = skillExtra;

  return result;
}

export async function syncExpertSkillsToProject(
  experts: Expert[],
  overrides: Record<string, Partial<ExpertEditableFields>>
): Promise<{ ok: boolean; message: string; written?: string[] }> {
  try {
    const payload = experts.map((expert) => ({
      id: expert.id,
      markdown: buildExpertSkillMarkdown(expert, overrides[expert.id]?.skillExtra),
    }));

    const response = await fetch('/api/skills/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: payload }),
    });

    const data = (await response.json()) as { ok?: boolean; message?: string; written?: string[] };
    if (!response.ok) {
      return { ok: false, message: data.message ?? 'שגיאה בסנכרון Skills' };
    }

    return {
      ok: true,
      message: data.message ?? 'Skills סונכרנו בהצלחה',
      written: data.written,
    };
  } catch {
    return { ok: false, message: 'לא ניתן להתחבר לשרת. הריצו npm run dev.' };
  }
}

export function downloadExpertSkill(expert: Expert, skillExtra?: string) {
  const markdown = buildExpertSkillMarkdown(expert, skillExtra);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${expertIdToSkillName(expert.id)}-SKILL.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readSkillFile(file: File): Promise<string> {
  return file.text();
}

export async function compressAvatarImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
