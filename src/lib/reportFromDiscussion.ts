import { DiscussionMessage, Expert, Finding, ReviewProject, ScoreExplanation } from '../types';
import type { AggregatedReport, ExpertReviewResult } from '../types/reviewEngine';

const CATEGORY_LABELS: Record<'clarity' | 'usability' | 'trust' | 'accessibility', string> = {
  clarity: 'בהירות ומסרים',
  usability: 'שימושיות וזרימה',
  trust: 'אמון וביטחון',
  accessibility: 'נגישות',
};

function penaltyForSeverity(severity: Finding['severity']): number {
  return severity === 'Critical' ? 12 : severity === 'High' ? 8 : severity === 'Medium' ? 4 : 2;
}

export function buildFindingsFromExpertReviews(
  expertReviews: ExpertReviewResult[],
  project: Pick<ReviewProject, 'url' | 'stage' | 'name' | 'id' | 'material'>,
  experts: Expert[]
): Finding[] {
  const location =
    project.material?.sourceUrl ||
    project.material?.fileNames?.join(', ') ||
    project.url ||
    project.stage ||
    project.name;

  const severityMap: Record<string, Finding['severity']> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const findings: Finding[] = [];
  for (const review of expertReviews) {
    const expertId =
      experts.find((e) => e.name === review.expert || review.expert.includes(e.name))?.id ??
      'unknown';

    for (const [index, f] of review.findings.entries()) {
      findings.push({
        id: `${project.id}-expert-${expertId}-${index}`,
        title: f.issue || 'ממצא מומחה',
        description: [f.evidence_from_screen, f.why_it_matters].filter(Boolean).join(' '),
        location,
        expertSources: expertId !== 'unknown' ? [expertId] : [],
        severity: severityMap[f.severity] ?? 'Medium',
        impact: f.why_it_matters || impactFromSeverity(severityMap[f.severity] ?? 'Medium'),
        effort: 'Medium',
        recommendation: f.recommendation || 'לטפל בממצא לפי המלצת המומחה',
        status: 'new',
      });
    }

    if (review.findings.length === 0 && review.summary?.trim()) {
      findings.push({
        id: `${project.id}-expert-summary-${expertId}`,
        title: firstSentence(review.summary) || `סיכום ${review.expert}`,
        description: review.summary.trim(),
        location,
        expertSources: expertId !== 'unknown' ? [expertId] : [],
        severity: 'Medium',
        impact: 'תובנה כללית מהניתוח המובנה של המומחה.',
        effort: 'Medium',
        recommendation: review.quick_wins[0] ?? 'לעבור על סיכום המומחה וליישם המלצות.',
        status: 'new',
      });
    }
  }
  return findings;
}

export function buildFindingsFromAggregatedReport(
  aggregated: AggregatedReport,
  project: Pick<ReviewProject, 'url' | 'stage' | 'name' | 'id' | 'material'>
): Finding[] {
  const location =
    project.material?.sourceUrl ||
    project.material?.fileNames?.join(', ') ||
    project.url ||
    project.stage ||
    project.name;

  const severityMap: Record<string, Finding['severity']> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return aggregated.top_issues.map((issue, index) => ({
    id: `${project.id}-agg-${index}`,
    title: issue.issue || 'ממצא מאיגוד מומחים',
    description: issue.recommendation || issue.issue,
    location,
    expertSources: [],
    severity: severityMap[issue.severity] ?? 'Medium',
    impact: impactFromSeverity(severityMap[issue.severity] ?? 'Medium'),
    effort: 'Medium',
    recommendation: issue.recommendation || 'לטפל לפי המלצת המומחים',
    status: 'new' as const,
  }));
}

/** בונה ממצאים מכל המקורות — גם אם findings לא נשמרו בזמן הפקת הדוח */
export function resolveFindings(
  project: Pick<ReviewProject, 'url' | 'stage' | 'name' | 'id' | 'material'>,
  savedFindings: Finding[] | undefined,
  messages: DiscussionMessage[],
  expertReviews: ExpertReviewResult[] | undefined,
  experts: Expert[],
  aggregatedReport?: AggregatedReport,
  userChatMessages?: DiscussionMessage[]
): Finding[] {
  if (savedFindings?.length) return savedFindings;

  const panelFindings = buildFindingsFromDiscussion(messages, project, { findingSource: 'panel' });
  const chatFindings = userChatMessages?.length
    ? buildFindingsFromDiscussion(userChatMessages, project, {
        idPrefix: 'chat-finding',
        findingSource: 'user_chat',
      })
    : [];
  const merged = [...panelFindings, ...chatFindings];
  if (merged.length) return merged;

  const fromDiscussion = buildFindingsFromDiscussion(messages, project);
  if (fromDiscussion.length) return fromDiscussion;

  if (userChatMessages?.length) {
    const fromChat = buildFindingsFromDiscussion(userChatMessages, project, {
      idPrefix: 'chat-finding',
      findingSource: 'user_chat',
    });
    if (fromChat.length) return fromChat;
  }

  if (expertReviews?.length) {
    const fromExperts = buildFindingsFromExpertReviews(expertReviews, project, experts);
    if (fromExperts.length) return fromExperts.map((f) => ({ ...f, findingSource: 'panel' as const }));
  }

  if (aggregatedReport?.top_issues?.length) {
    return buildFindingsFromAggregatedReport(aggregatedReport, project);
  }

  return [];
}

function firstSentence(text: string, maxLen = 90): string {
  const cleaned = text.replace(/\[(OBSERVATION|CONFLICT|RECOMMENDATION|המלצה)\]\s*/gi, '').trim();
  const match = cleaned.match(/^[^.!?]+[.!?]?/);
  const sentence = (match?.[0] ?? cleaned).trim();
  return sentence.length > maxLen ? `${sentence.slice(0, maxLen - 1)}…` : sentence;
}

function severityFromMessage(type: DiscussionMessage['type']): Finding['severity'] {
  switch (type) {
    case 'conflict':
      return 'High';
    case 'recommendation':
      return 'Medium';
    default:
      return 'Medium';
  }
}

function impactFromSeverity(severity: Finding['severity']): string {
  switch (severity) {
    case 'Critical':
      return 'השפעה קריטית על השלמת המשימה והמרה.';
    case 'High':
      return 'עלול לגרום לנטישה או לעיכוב משמעותי בתהליך.';
    case 'Medium':
      return 'מפריע לחוויית השימוש ודורש שיפור.';
    default:
      return 'שיפור מומלץ לחוויית משתמש.';
  }
}

function effortFromType(type: DiscussionMessage['type']): string {
  return type === 'conflict' ? 'Medium' : 'Low';
}

function recommendationFromMessage(msg: DiscussionMessage): string {
  if (msg.type === 'recommendation') {
    return msg.text.replace(/\[(OBSERVATION|CONFLICT|RECOMMENDATION|המלצה)\]\s*/gi, '').trim();
  }
  if (msg.type === 'conflict') {
    return 'לאשר כיוון אחד בין המומחים וליישם פתרון שמפחית חיכוך לפני השקה.';
  }
  return `לטפל בתובנה שעלה בדיון: ${firstSentence(msg.text, 120)}`;
}

export function buildFindingsFromDiscussion(
  messages: DiscussionMessage[],
  project: Pick<ReviewProject, 'url' | 'stage' | 'name' | 'id' | 'material'>,
  options?: { idPrefix?: string; findingSource?: Finding['findingSource'] }
): Finding[] {
  const idPrefix = options?.idPrefix ?? 'finding';
  const findingSource = options?.findingSource;
  const location =
    project.material?.sourceUrl ||
    project.material?.fileNames?.join(', ') ||
    project.url ||
    project.stage ||
    project.name;

  return messages
    .filter((m) => m.expertId !== 'system' && m.expertId !== 'user')
    .map((msg, index) => {
      const severity = severityFromMessage(msg.type);
      const description = msg.text
        .replace(/\[(OBSERVATION|CONFLICT|RECOMMENDATION|המלצה)\]\s*/gi, '')
        .trim();

      return {
        id: `${project.id}-${idPrefix}-${index}`,
        title: firstSentence(description) || 'ממצא מפאנל המומחים',
        description,
        location,
        expertSources: [msg.expertId],
        severity,
        impact: impactFromSeverity(severity),
        effort: effortFromType(msg.type),
        recommendation: recommendationFromMessage(msg),
        status: 'new' as const,
        ...(findingSource ? { findingSource } : {}),
      };
    });
}

const EXPERT_SCORE_KEYS: Record<string, 'clarity' | 'usability' | 'trust' | 'accessibility'> = {
  accessibility_wcag: 'accessibility',
  usability_nielsen: 'usability',
  ux_don_norman: 'usability',
  simplicity_krug: 'usability',
  marketing_cro: 'clarity',
  visual_hierarchy: 'clarity',
  behavioral_economics: 'trust',
  interaction_psychology: 'trust',
  attention_cognitive_load: 'usability',
  domain_specialist: 'clarity',
};

const DEFAULT_CATEGORY_KEYS = {
  clarity: 80,
  usability: 78,
  trust: 75,
  accessibility: 78,
} as const;

export function buildScoresFromFindings(
  findings: Finding[],
  selectedExpertIds: string[]
): Record<string, number> {
  const scores: Record<string, number> = {
    clarity: DEFAULT_CATEGORY_KEYS.clarity,
    usability: DEFAULT_CATEGORY_KEYS.usability,
    trust: DEFAULT_CATEGORY_KEYS.trust,
    accessibility: DEFAULT_CATEGORY_KEYS.accessibility,
    overall: 78,
  };

  for (const finding of findings) {
    const penalty = penaltyForSeverity(finding.severity);

    for (const expertId of finding.expertSources) {
      const key = EXPERT_SCORE_KEYS[expertId];
      if (key && key in scores) {
        scores[key] = Math.max(40, (scores[key] ?? 70) - penalty);
      }
    }
  }

  const categoryValues = [scores.clarity, scores.usability, scores.trust, scores.accessibility];
  const expertBonus = Math.min(5, selectedExpertIds.length);
  scores.overall = Math.round(
    categoryValues.reduce((a, b) => a + b, 0) / categoryValues.length + expertBonus * 0.5
  );
  scores.overall = Math.min(95, Math.max(45, scores.overall));

  return scores;
}

export function buildScoreExplanations(
  scores: Record<string, number>,
  findings: Finding[],
  experts: Expert[],
  messages: DiscussionMessage[],
  expertReviews?: ExpertReviewResult[]
): ScoreExplanation[] {
  const categories = ['clarity', 'usability', 'trust', 'accessibility'] as const;

  const categoryExplanations: ScoreExplanation[] = categories.map((key) => {
    const baseScore = DEFAULT_CATEGORY_KEYS[key];
    const finalScore = scores[key] ?? baseScore;
    const relatedFindings = findings.filter((f) =>
      f.expertSources.some((id) => EXPERT_SCORE_KEYS[id] === key)
    );

    const factors: string[] = [];
    for (const f of relatedFindings) {
      const penalty = penaltyForSeverity(f.severity);
      const expertName =
        experts.find((e) => e.id === f.expertSources[0])?.name ?? f.expertSources[0];
      factors.push(`${expertName}: "${f.title}" (${f.severity}) — הפחתה של ~${penalty} נקודות`);
    }

    const relatedMessages = messages.filter(
      (m) => m.expertId !== 'system' && m.expertId !== 'user' && EXPERT_SCORE_KEYS[m.expertId] === key
    );
    if (relatedMessages.length > 0 && factors.length === 0) {
      for (const msg of relatedMessages.slice(0, 3)) {
        const expertName = experts.find((e) => e.id === msg.expertId)?.name ?? msg.expertId;
        factors.push(`${expertName}: ${firstSentence(msg.text, 100)}`);
      }
    }

    let explanation: string;
    if (relatedFindings.length === 0 && relatedMessages.length === 0) {
      explanation = `ציון בסיס ${baseScore}. לא זוהו ממצאים שליליים בקטגוריה "${CATEGORY_LABELS[key]}".`;
    } else if (relatedFindings.length > 0) {
      explanation =
        `התחלנו מציון בסיס ${baseScore}. ` +
        `${relatedFindings.length} ממצאים בקטגוריה "${CATEGORY_LABELS[key]}" הורידו את הציון ל-${finalScore}.`;
    } else {
      explanation =
        `ציון ${finalScore} מבוסס על ${relatedMessages.length} תובנות מהדיון בקטגוריה "${CATEGORY_LABELS[key]}".`;
    }

    return { key, label: CATEGORY_LABELS[key], score: finalScore, explanation, factors };
  });

  const overallScore = scores.overall ?? 78;
  const overallFactors: string[] = [];
  const categoryAvg = Math.round(
    categories.reduce((sum, k) => sum + (scores[k] ?? DEFAULT_CATEGORY_KEYS[k]), 0) / categories.length
  );

  if (expertReviews?.length) {
    for (const review of expertReviews) {
      overallFactors.push(`${review.expert}: ציון ${review.score}/100 — ${firstSentence(review.summary, 120)}`);
    }
  }

  const highSeverityCount = findings.filter(
    (f) => f.severity === 'Critical' || f.severity === 'High'
  ).length;
  if (highSeverityCount > 0) {
    overallFactors.push(`${highSeverityCount} ממצאים בדחיפות גבוהה/קריטית משפיעים על הציון הכללי`);
  }

  const expertMessageCount = messages.filter((m) => m.expertId !== 'system' && m.expertId !== 'user').length;
  const overallExplanation =
    expertReviews?.length
      ? `ציון משוקלל ${overallScore} — ממוצע קטגוריות (${categoryAvg}) עם התחשבות ב-${expertReviews.length} ניתוחי מומחים מובנים.`
      : expertMessageCount > 0
        ? `ציון משוקלל ${overallScore} — מחושב מממוצע 4 קטגוריות (${categoryAvg}) ו-${expertMessageCount} תובנות מהדיון.`
        : `ציון משוקלל ${overallScore} — מבוסס על ממוצע קטגוריות (${categoryAvg}).`;

  return [
    ...categoryExplanations,
    {
      key: 'overall',
      label: 'ציון חוויה משוקלל',
      score: overallScore,
      explanation: overallExplanation,
      factors: overallFactors,
    },
  ];
}

export function buildExecutiveSummary(
  findings: Finding[],
  experts: Expert[],
  project: Pick<ReviewProject, 'goal' | 'name'>
): string {
  if (findings.length === 0) {
    return `לא נרשמו תובנות ממומחים בדיון עבור "${project.name}". מומלץ להריץ מחדש את הפאנל או לוודא שהדיון הושלם.`;
  }

  const highCount = findings.filter((f) => f.severity === 'High' || f.severity === 'Critical').length;
  const expertNames = [
    ...new Set(
      findings.flatMap((f) =>
        f.expertSources.map((id) => experts.find((e) => e.id === id)?.name ?? id)
      )
    ),
  ];

  const topTitles = findings.slice(0, 3).map((f) => f.title);
  const themes = topTitles.join('; ');

  return (
    `בבדיקה "${project.name}" (מטרה: ${project.goal}) השתתפו ${expertNames.length} מומחים ` +
    `(${expertNames.join(', ')}) והועלו ${findings.length} ממצאים מהדיון. ` +
    (highCount > 0
      ? `${highCount} ממצאים בדחיפות גבוהה דורשים טיפול מיידי. `
      : 'רוב הממצאים ברמת חומרה בינונית. ') +
    `נושאים מרכזיים שעלו: ${themes}.`
  );
}

const PLACEHOLDER_SUMMARY_MARKERS = ['לא נרשמו תובנות ממומחים', 'לא נשמר — הפעילו מחדש'];

function isPlaceholderSummary(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  return PLACEHOLDER_SUMMARY_MARKERS.some((m) => text.includes(m));
}

export function resolveExecutiveSummary(
  project: Pick<ReviewProject, 'goal' | 'name'>,
  findings: Finding[],
  experts: Expert[],
  options: {
    messages?: DiscussionMessage[];
    expertReviews?: ExpertReviewResult[];
    aggregatedReport?: { main_summary?: string };
    screenExtraction?: { screen_summary?: string };
    savedSummary?: string;
  } = {}
): string {
  const {
    messages = [],
    expertReviews,
    aggregatedReport,
    screenExtraction,
    savedSummary,
  } = options;

  const fromAggregate = aggregatedReport?.main_summary?.trim();
  if (fromAggregate) return fromAggregate;

  const saved = savedSummary?.trim();
  if (saved && !isPlaceholderSummary(saved)) return saved;

  if (findings.length > 0) {
    return buildExecutiveSummary(findings, experts, project);
  }

  const reviewsWithContent = (expertReviews ?? []).filter(
    (r) => r.summary?.trim() || r.findings.length > 0
  );
  if (reviewsWithContent.length > 0) {
    const expertNames = reviewsWithContent.map((r) => r.expert).join(', ');
    const highlights = reviewsWithContent
      .slice(0, 3)
      .map((r) =>
        r.summary?.trim()
          ? firstSentence(r.summary, 120)
          : r.findings[0]?.issue
      )
      .filter(Boolean);
    return (
      `בבדיקה "${project.name}" (מטרה: ${project.goal}) ${reviewsWithContent.length} מומחים ניתחו את המסך (${expertNames}). ` +
      (highlights.length > 0 ? `עיקרי הממצאים: ${highlights.join('; ')}.` : '')
    );
  }

  const expertMessages = messages.filter((m) => m.expertId !== 'system' && m.expertId !== 'user');
  if (expertMessages.length > 0) {
    const names = [
      ...new Set(
        expertMessages.map((m) => experts.find((e) => e.id === m.expertId)?.name ?? m.expertId)
      ),
    ];
    const highlights = expertMessages.slice(0, 3).map((m) => firstSentence(m.text, 100));
    return (
      `בבדיקה "${project.name}" (מטרה: ${project.goal}) נרשמו ${expertMessages.length} תובנות מ-${names.length} מומחים (${names.join(', ')}). ` +
      `נושאים מרכזיים: ${highlights.join('; ')}.`
    );
  }

  if (screenExtraction?.screen_summary?.trim()) {
    return (
      `ניתוח Vision הושלם עבור "${project.name}" — ${firstSentence(screenExtraction.screen_summary, 220)} ` +
      `הדיון עם המומחים לא הושלם או לא נשמר; חזרו לחדר הדיון, המתינו לסיום כל המומחים, והפיקו דוח מחדש.`
    );
  }

  return buildExecutiveSummary(findings, experts, project);
}
