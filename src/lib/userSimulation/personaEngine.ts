import { chatForTask } from '../llmRouter';
import { parseJsonResponse } from '../reviewEngine/parseJson';
import type { LlmSettings } from '../../types/llm';
import type { PersonaQuestion, SavedPersona, UXMethodologyResult } from '../../types/userSimulation';
import type { ChatContentPart } from '../../../vite-llm-api';
import {
  buildAnalyzeFlowPrompt,
  buildBusinessContextSupplement,
  buildPersonaDescriptionPrompt,
  buildPersonaQuestionsPrompt,
} from './prompts';

function validateUXResult(data: UXMethodologyResult): UXMethodologyResult {
  return {
    contextGoal: data.contextGoal ?? '',
    userCommitmentLevel: data.userCommitmentLevel ?? '',
    firstElementSeen: data.firstElementSeen ?? '',
    secondElementSeen: data.secondElementSeen ?? '',
    hierarchyMatch: Boolean(data.hierarchyMatch),
    hierarchyAnalysis: data.hierarchyAnalysis ?? '',
    cognitiveLoadAnalysis: data.cognitiveLoadAnalysis ?? '',
    emotionalAnalysis: data.emotionalAnalysis ?? '',
    frictionPoints: Array.isArray(data.frictionPoints) ? data.frictionPoints : [],
    estimatedDropOffRate: data.estimatedDropOffRate ?? '',
    trustAnalysis: data.trustAnalysis ?? '',
    kpiToMeasure: Array.isArray(data.kpiToMeasure) ? data.kpiToMeasure : [],
    dropOffHypothesis: data.dropOffHypothesis ?? '',
    solutions: Array.isArray(data.solutions) ? data.solutions : [],
    prioritization: {
      quickWins: data.prioritization?.quickWins ?? [],
      mediumImpact: data.prioritization?.mediumImpact ?? [],
      structuralRedesign: data.prioritization?.structuralRedesign ?? [],
    },
  };
}

export async function generatePersonaQuestions(
  settings: LlmSettings,
  role: string
): Promise<PersonaQuestion[]> {
  const text = await chatForTask(settings, 'user_simulation', [
    { role: 'user', content: buildPersonaQuestionsPrompt(role) },
  ]);
  const parsed = parseJsonResponse<PersonaQuestion[]>(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('לא התקבלו שאלות לפרסונה');
  }
  return parsed;
}

export async function generatePersonaDescription(
  settings: LlmSettings,
  role: string,
  qa: { question: string; answer: string[] }[]
): Promise<string> {
  const text = await chatForTask(settings, 'user_simulation', [
    { role: 'user', content: buildPersonaDescriptionPrompt(role, qa) },
  ]);
  const trimmed = text.trim();
  if (!trimmed) throw new Error('לא התקבל תיאור פרסונה');
  return trimmed;
}

export async function analyzeFlow(
  settings: LlmSettings,
  images: string[],
  persona: Pick<SavedPersona, 'role' | 'characteristics'>,
  tasks: string[],
  businessContext?: { goal?: string; targetAudience?: string; domain?: string }
): Promise<UXMethodologyResult> {
  if (images.length === 0) throw new Error('נדרשת לפחות תמונה אחת לניתוח');

  const prompt =
    buildAnalyzeFlowPrompt(persona, tasks) + buildBusinessContextSupplement(businessContext ?? {});

  const content: ChatContentPart[] = [{ type: 'text', text: prompt }];
  for (const img of images) {
    content.push({ type: 'image_url', image_url: { url: img } });
  }

  const runOnce = async () => {
    const text = await chatForTask(
      settings,
      'user_simulation',
      [{ role: 'user', content }],
      { maxTokens: 4096, temperature: 0.4 }
    );
    return validateUXResult(parseJsonResponse<UXMethodologyResult>(text));
  };

  try {
    return await runOnce();
  } catch {
    return runOnce();
  }
}
