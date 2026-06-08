import { LlmSettings } from '../../types/llm';
import { AggregatedReport, ExpertReviewResult } from '../../types/reviewEngine';
import { chatForTask } from '../llmRouter';
import { parseJsonResponse } from './parseJson';

const AGGREGATE_SYSTEM = `You are a senior product design reviewer.
You received several expert reviews of the same screen.
Merge duplicate findings, identify critical issues, and create a prioritized action plan.
Respond in Hebrew for summaries and actions.
Return valid JSON only — no markdown fences.`;

function buildAggregateUser(reviews: ExpertReviewResult[]): string {
  return `Expert reviews JSON:
${JSON.stringify(reviews, null, 2)}

Your task:
1. Merge duplicate findings.
2. Identify the most critical issues.
3. Create a prioritized action plan.
4. Keep recommendations practical.

Return JSON:
{
  "overall_score": 0,
  "main_summary": "",
  "top_issues": [
    {
      "issue": "",
      "severity": "low | medium | high",
      "mentioned_by": [],
      "recommendation": ""
    }
  ],
  "priority_action_plan": [
    {
      "priority": 1,
      "action": "",
      "expected_impact": ""
    }
  ],
  "quick_wins": [],
  "requires_human_review": []
}`;
}

export async function aggregateExpertReviews(
  reviews: ExpertReviewResult[],
  settings: LlmSettings
): Promise<AggregatedReport | null> {
  if (!reviews.length || settings.taskModels.report_aggregate.provider === 'mock') {
    return null;
  }

  const content = await chatForTask(
    settings,
    'report_aggregate',
    [
      { role: 'system', content: AGGREGATE_SYSTEM },
      { role: 'user', content: buildAggregateUser(reviews) },
    ],
    { maxTokens: 2048, temperature: 0.4 }
  );

  const parsed = parseJsonResponse<AggregatedReport>(content);
  return {
    overall_score: parsed.overall_score ?? 0,
    main_summary: parsed.main_summary ?? '',
    top_issues: parsed.top_issues ?? [],
    priority_action_plan: parsed.priority_action_plan ?? [],
    quick_wins: parsed.quick_wins ?? [],
    requires_human_review: parsed.requires_human_review ?? [],
  };
}
