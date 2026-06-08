import { buildExpertSkillMarkdown } from './expertSkill';
import { DEFAULT_LLM_SETTINGS } from './llmDefaults';
import { chatForTask, checkProviderHealth } from './llmRouter';
import { formatScreenExtractionForPrompt } from './reviewEngine/visionExtract';
import { hasAnalyzableMaterial, materialContextLines } from './testMaterial';
import { DiscussionMessage, Expert, ExpertOverrides, ReviewProject } from '../types';
import { LlmSettings } from '../types/llm';
import type { ChatContentPart } from '../../vite-llm-api';

const ANALYSIS_RULES = `
כללי ניתוח (חובה):
- מקור האמת הוא נתוני חילוץ המסך (JSON) ו/או החומר שהמשתמש העלה.
- תאר רק מה שמופיע ב-JSON או בתמונה — אל תמציא מסכים, תהליכים או מוצר שלא מופיעים.
- אם מידע חסר, ציין במפורש: "לא ניתן לקבוע מהצילום".
- כל תובנה חייבת להתבסס על ראיה מהמסך (טקסט, כפתור, אזור שצוין ב-JSON).
- שדות "תחום / מטרה / קהל" הם הקשר משלים בלבד.`;

function buildOptionalBusinessContext(project: ReviewProject): string | null {
  const parts = [
    project.goal?.trim() ? `מטרת הבדיקה (משלים): ${project.goal.trim()}` : null,
    project.targetAudience?.trim() ? `קהל יעד (משלים): ${project.targetAudience.trim()}` : null,
    project.domain?.trim() && project.domain !== 'אחר'
      ? `תחום (משלים): ${project.domain}`
      : null,
    project.stage?.trim() ? `שלב (משלים): ${project.stage}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join('\n') : null;
}

function buildMaterialFirstContext(project: ReviewProject): string {
  const materialBlock = materialContextLines(project.material, project.url);
  const optional = buildOptionalBusinessContext(project);

  const blocks = [
    '=== חומר לבדיקה (מקור האמת — נתח רק את זה) ===',
    ...materialBlock,
    project.name?.trim() ? `שם הבדיקה: ${project.name.trim()}` : null,
    optional ? `\n=== הקשר עסקי משלים (אופציונלי, לא מחליף את החומר) ===\n${optional}` : null,
  ].filter((line): line is string => Boolean(line));

  if (project.screenExtraction) {
    blocks.push(
      '\n=== חילוץ אובייקטיבי מהמסך (JSON) ===',
      formatScreenExtractionForPrompt(project.screenExtraction)
    );
  }

  if (!hasAnalyzableMaterial(project)) {
    blocks.push(
      'אזהרה: לא זוהה חומר ויזואלי או קישור תקין — בקשו מהמשתמש להעלות תמונה/קישור בוויזארד.'
    );
  }

  return blocks.join('\n');
}

function buildUserMessageContent(
  project: ReviewProject,
  expertName: string,
  transcript: string,
  includeImage: boolean
): string | ChatContentPart[] {
  const text = `${buildMaterialFirstContext(project)}

${transcript ? `שיחה עד כה בין המומחים:\n${transcript}\n\n` : ''}תורך לדבר כ-${expertName}.
${ANALYSIS_RULES}
התחל בשורה הראשונה באחד מהתגים: [OBSERVATION], [CONFLICT], או [RECOMMENDATION].
אחרי התג — תובנה אחת ספציפית עם ראיה מהמסך (2–4 משפטים).`;

  const imageUrl = includeImage ? project.material?.imageDataUrl : undefined;
  if (imageUrl) {
    return [
      {
        type: 'text',
        text: `${text}\n\nהתמונה המצורפת היא המוצר לבדיקה — התייחס אליה ישירות ובהתאם ל-JSON.`,
      },
      { type: 'image_url', image_url: { url: imageUrl } },
    ];
  }
  return text;
}

export function parseExpertMessageType(text: string): DiscussionMessage['type'] {
  const upper = text.trim().toUpperCase();
  if (upper.startsWith('[CONFLICT]') || upper.includes('מחלוקת')) return 'conflict';
  if (upper.startsWith('[RECOMMENDATION]') || upper.startsWith('[המלצה]')) return 'recommendation';
  return 'observation';
}

export function stripMessageTypePrefix(text: string): string {
  return text
    .replace(/^\[(OBSERVATION|CONFLICT|RECOMMENDATION|המלצה)\]\s*/i, '')
    .trim();
}

export function buildExpertDiscussionPrompt(
  expert: Expert,
  project: ReviewProject,
  priorMessages: DiscussionMessage[],
  expertOverrides: ExpertOverrides,
  allExperts: Expert[],
  settings: LlmSettings = DEFAULT_LLM_SETTINGS
): { system: string; user: string | ChatContentPart[] } {
  const skillExtra = expertOverrides[expert.id]?.skillExtra;
  const skillMarkdown = buildExpertSkillMarkdown(expert, skillExtra);

  const expertNameById = new Map(allExperts.map((e) => [e.id, e.name]));

  const transcript = priorMessages
    .filter((m) => m.expertId !== 'system')
    .map((m) => {
      const name =
        m.expertId === 'user' ? 'משתמש' : (expertNameById.get(m.expertId) ?? m.expertId);
      return `${name}: ${m.text}`;
    })
    .join('\n');

  const discussionConfig = settings.taskModels.discussion_turn;
  const includeImage =
    Boolean(project.material?.imageDataUrl) &&
    discussionConfig.supportsVision &&
    discussionConfig.provider !== 'mock';

  const system = `${skillMarkdown}

---
אתה משתתף בפאנל מומחי UX. דבר בעברית, בגוף ראשון.
${ANALYSIS_RULES}`;

  const user = buildUserMessageContent(project, expert.name, transcript, includeImage);

  return { system, user };
}

export async function fetchExpertDiscussionMessage(
  expert: Expert,
  project: ReviewProject,
  priorMessages: DiscussionMessage[],
  expertOverrides: ExpertOverrides,
  allExperts: Expert[],
  settings: LlmSettings = DEFAULT_LLM_SETTINGS
): Promise<{ text: string; type: DiscussionMessage['type'] }> {
  const { system, user } = buildExpertDiscussionPrompt(
    expert,
    project,
    priorMessages,
    expertOverrides,
    allExperts,
    settings
  );

  const hasVision = Array.isArray(user);
  const raw = await chatForTask(
    settings,
    'discussion_turn',
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: hasVision ? 1536 : 1024, temperature: 0.55 }
  );

  const type = parseExpertMessageType(raw);
  const text = stripMessageTypePrefix(raw);
  return { text, type };
}

export async function checkLmStudioHealth(
  baseUrl: string = DEFAULT_LLM_SETTINGS.lmStudioBaseUrl
): Promise<{ ok: boolean; message: string }> {
  return checkProviderHealth('lm_studio', baseUrl);
}
