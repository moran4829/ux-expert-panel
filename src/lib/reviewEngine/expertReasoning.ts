import { Expert } from '../../types';
import { LlmSettings } from '../../types/llm';
import { ExpertReviewResult, ScreenExtraction } from '../../types/reviewEngine';
import { chatForTask } from '../llmRouter';
import {
  ENGINE_EXPERT_FOCUS,
  ENGINE_EXPERT_LABELS,
  getEngineExpertId,
} from './expertProfiles';
import { parseJsonResponse } from './parseJson';
import { formatScreenExtractionForPrompt } from './visionExtract';

function buildExpertPrompt(
  expert: Expert,
  screenJson: string,
  productContext: string
): { system: string; user: string } {
  const engineId = getEngineExpertId(expert.id);
  const expertName = ENGINE_EXPERT_LABELS[engineId];
  const focus = ENGINE_EXPERT_FOCUS[engineId];

  const system = `You are an expert in ${expertName}.
Focus areas: ${focus}
Analyze the UI screen based on your professional perspective.
Respond in Hebrew for summary, findings, and recommendations.
Return valid JSON only — no markdown fences.`;

  const user = `Input:
- Screen extraction JSON:
${screenJson}

- Product context:
${productContext || 'לא סופק הקשר נוסף'}

- Expert persona: ${expert.name} — ${expert.role}

Rules:
- Base your analysis only on the provided screen data.
- Do not invent elements that are not in the JSON.
- If information is missing, say that it cannot be determined from the screenshot.
- Give practical recommendations.
- Be specific and actionable.
- Every finding must include evidence_from_screen.

Return valid JSON:
{
  "expert": "${expertName}",
  "summary": "",
  "score": 0,
  "findings": [
    {
      "issue": "",
      "severity": "low | medium | high",
      "evidence_from_screen": "",
      "why_it_matters": "",
      "recommendation": ""
    }
  ],
  "quick_wins": [],
  "open_questions": []
}`;

  return { system, user };
}

export async function runExpertReasoning(
  expert: Expert,
  extraction: ScreenExtraction,
  productContext: string,
  settings: LlmSettings
): Promise<ExpertReviewResult> {
  const screenJson = formatScreenExtractionForPrompt(extraction);
  const { system, user } = buildExpertPrompt(expert, screenJson, productContext);

  const content = await chatForTask(
    settings,
    'expert_reasoning',
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: 1536, temperature: 0.45 }
  );

  const parsed = parseJsonResponse<ExpertReviewResult>(content);
  return {
    expert: parsed.expert || ENGINE_EXPERT_LABELS[getEngineExpertId(expert.id)],
    summary: parsed.summary ?? '',
    score: typeof parsed.score === 'number' ? parsed.score : 0,
    findings: parsed.findings ?? [],
    quick_wins: parsed.quick_wins ?? [],
    open_questions: parsed.open_questions ?? [],
  };
}

export async function runAllExpertReasoning(
  experts: Expert[],
  extraction: ScreenExtraction,
  productContext: string,
  settings: LlmSettings
): Promise<ExpertReviewResult[]> {
  if (settings.taskModels.expert_reasoning.provider === 'mock') return [];

  const results: ExpertReviewResult[] = [];
  for (const expert of experts) {
    const result = await runExpertReasoning(expert, extraction, productContext, settings);
    results.push(result);
  }
  return results;
}
