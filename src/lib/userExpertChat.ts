import { parseJsonResponse } from './reviewEngine/parseJson';
import {
  parseExpertMessageType,
  stripMessageTypePrefix,
} from './llm';
import { chatForTask } from './llmRouter';
import { DiscussionMessage, Expert, ExpertOverrides, ReviewProject } from '../types';
import { LlmSettings } from '../types/llm';

type ChatResponseItem = {
  expertId: string;
  text: string;
  type: DiscussionMessage['type'];
};

function buildTranscript(
  messages: DiscussionMessage[],
  expertNameById: Map<string, string>
): string {
  return messages
    .filter((m) => m.expertId !== 'system')
    .map((m) => {
      const name =
        m.expertId === 'user'
          ? 'משתמש/ת המערכת'
          : (expertNameById.get(m.expertId) ?? m.expertId);
      return `${name}: ${m.text}`;
    })
    .join('\n');
}

function mockChatResponses(
  userMessage: string,
  selectedExperts: Expert[],
  chatMessages: DiscussionMessage[]
): ChatResponseItem[] {
  const expertCount = chatMessages.filter((m) => m.expertId !== 'user' && m.expertId !== 'system').length;
  const expertA = selectedExperts[expertCount % selectedExperts.length];
  const expertB = selectedExperts[(expertCount + 1) % selectedExperts.length];
  if (!expertA) return [];

  const responses: ChatResponseItem[] = [
    {
      expertId: expertA.id,
      text: `לגבי "${userMessage.slice(0, 60)}${userMessage.length > 60 ? '…' : ''}" — מהניתוח שלי, כדאי לבדוק את האזור שעלה בדיון ולוודא שהמשתמש מבין את השלב הבא.`,
      type: 'recommendation',
    },
  ];
  if (expertB && expertB.id !== expertA.id) {
    responses.push({
      expertId: expertB.id,
      text: 'מסכים/ה בכיוון הכללי, ומוסיף/ה שכדאי לבדוק גם את ההקשר העסקי והקהל לפני שינוי משמעותי.',
      type: 'observation',
    });
  }
  return responses;
}

export async function fetchUserChatExpertResponses(
  userMessage: string,
  project: ReviewProject,
  panelMessages: DiscussionMessage[],
  chatMessages: DiscussionMessage[],
  selectedExperts: Expert[],
  _expertOverrides: ExpertOverrides,
  allExperts: Expert[],
  settings: LlmSettings
): Promise<ChatResponseItem[]> {
  if (settings.taskModels.discussion_turn.provider === 'mock') {
    return mockChatResponses(userMessage, selectedExperts, chatMessages);
  }

  const expertNameById = new Map(allExperts.map((e) => [e.id, e.name]));
  const expertList = selectedExperts
    .map((e) => `- ${e.name} (${e.role}) [id: ${e.id}]`)
    .join('\n');

  const panelTranscript = buildTranscript(panelMessages, expertNameById);
  const chatTranscript = buildTranscript(chatMessages, expertNameById);

  const system = `You are moderating a live Q&A between a product owner and a UX expert panel.
The panel already completed an initial review. The owner may challenge conclusions, ask for clarifications, or explore alternatives.
Respond in Hebrew. Be practical and refer to the screen/material when relevant.
Return valid JSON only — no markdown fences.`;

  const user = `Project: ${project.name}
Goal: ${project.goal}

Selected experts (pick 2–3 most relevant to answer):
${expertList}

Initial panel discussion:
${panelTranscript || '(no panel transcript)'}

User chat so far:
${chatTranscript || '(chat just started)'}

Product owner message:
${userMessage}

Return JSON:
{
  "responses": [
    {
      "expertId": "expert_id_from_list",
      "text": "2-4 sentences in Hebrew",
      "type": "observation | recommendation | conflict"
    }
  ]
}

Rules:
- Only use expertId values from the list above.
- 2–3 responses maximum.
- Experts may agree, disagree, or refine prior conclusions.
- If the user asks to change a conclusion, experts should respond with updated recommendations.`;

  const content = await chatForTask(
    settings,
    'discussion_turn',
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: 1536, temperature: 0.55 }
  );

  try {
    const parsed = parseJsonResponse<{ responses?: Array<{ expertId?: string; text?: string; type?: string }> }>(
      content
    );
    const validIds = new Set(selectedExperts.map((e) => e.id));
    return (parsed.responses ?? [])
      .filter((r) => r.expertId && r.text && validIds.has(r.expertId))
      .slice(0, 3)
      .map((r) => ({
        expertId: r.expertId!,
        text: stripMessageTypePrefix(r.text!),
        type: parseExpertMessageType(r.text!),
      }));
  } catch {
    const fallbackExpert = selectedExperts[0];
    if (!fallbackExpert) return [];
    return [
      {
        expertId: fallbackExpert.id,
        text: stripMessageTypePrefix(content),
        type: parseExpertMessageType(content),
      },
    ];
  }
}

export function mergePanelAndChatFindings(
  panelFindings: import('../types').Finding[],
  chatFindings: import('../types').Finding[]
): import('../types').Finding[] {
  return [
    ...panelFindings.map((f) => ({ ...f, findingSource: 'panel' as const })),
    ...chatFindings.map((f) => ({ ...f, findingSource: 'user_chat' as const })),
  ];
}
