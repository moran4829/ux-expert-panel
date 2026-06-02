import { DiscussionMessage, Expert, Finding, ReviewProject } from '../types';

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
  project: Pick<ReviewProject, 'url' | 'stage' | 'name' | 'id' | 'material'>
): Finding[] {
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
        id: `${project.id}-finding-${index}`,
        title: firstSentence(description) || 'ממצא מפאנל המומחים',
        description,
        location,
        expertSources: [msg.expertId],
        severity,
        impact: impactFromSeverity(severity),
        effort: effortFromType(msg.type),
        recommendation: recommendationFromMessage(msg),
        status: 'new' as const,
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
    const penalty =
      finding.severity === 'Critical' ? 12 : finding.severity === 'High' ? 8 : finding.severity === 'Medium' ? 4 : 2;

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
