import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { buildScoreExplanations, resolveExecutiveSummary, resolveFindings } from '../../lib/reportFromDiscussion';
import { showUserSimulationInReport } from '../../lib/projectKind';
import {
  ChevronRightIcon,
  DownloadIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  UsersIcon,
  MessageIcon,
} from '../../components/icons';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';
import type { ScoreCategory } from '../../types';

type ReportTab = 'summary' | 'findings' | 'rawResults' | 'userTesting';

const CATEGORY_ICONS: Record<Exclude<ScoreCategory, 'overall'>, typeof CheckCircleIcon> = {
  clarity: CheckCircleIcon,
  usability: TrendingUpIcon,
  trust: AlertTriangleIcon,
  accessibility: AlertTriangleIcon,
};

const CATEGORY_COLORS: Record<Exclude<ScoreCategory, 'overall'>, string> = {
  clarity: 'text-[var(--color-podium-success)]',
  usability: 'text-[var(--color-podium-info)]',
  trust: 'text-[var(--color-podium-warning)]',
  accessibility: 'text-[var(--color-podium-warning)]',
};

export function ReportView() {
  const { currentProjectId, projects, navigate, experts } = useAppContext();
  const project = projects.find((p) => p.id === currentProjectId);
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  const messages = project?.messages ?? [];
  const userChatMessages = project?.userChatMessages ?? [];
  const expertMessages = messages.filter((m) => m.expertId !== 'system' && m.expertId !== 'user');
  const expertReviews = project?.expertReviews ?? [];

  const findings = useMemo(
    () =>
      project
        ? resolveFindings(
            project,
            project.findings,
            messages,
            expertReviews,
            experts,
            project.aggregatedReport,
            userChatMessages
          )
        : [],
    [project, messages, userChatMessages, expertReviews, experts]
  );

  const scoreExplanations = useMemo(
    () =>
      project?.scoreExplanations ??
      buildScoreExplanations(
        project?.scores ?? {},
        findings,
        experts,
        [...messages, ...userChatMessages],
        expertReviews
      ),
    [project?.scoreExplanations, project?.scores, findings, experts, messages, userChatMessages, expertReviews]
  );

  const showUserTab = project ? showUserSimulationInReport(project) : false;

  useEffect(() => {
    if (!showUserTab && activeTab === 'userTesting') {
      setActiveTab('summary');
    }
  }, [showUserTab, activeTab]);

  if (!project) return <div>Project not found</div>;

  const overallScore = project.scores?.overall && project.scores.overall > 0 ? project.scores.overall : 72;
  const executiveSummary = resolveExecutiveSummary(project, findings, experts, {
    messages,
    expertReviews,
    aggregatedReport: project.aggregatedReport,
    screenExtraction: project.screenExtraction,
    savedSummary: project.executiveSummary,
  });
  const aggregated = project.aggregatedReport;
  const screenSummary = project.screenExtraction?.screen_summary;

  const overallExplanation = scoreExplanations.find((s) => s.key === 'overall');
  const categoryExplanations = scoreExplanations.filter((s) => s.key !== 'overall');

  const getSeverityVariant = (sev: string): 'danger' | 'warning' | 'info' | 'default' => {
    switch (sev) {
      case 'Critical':
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityHebrew = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'קריטי';
      case 'High':
        return 'גבוהה';
      case 'Medium':
        return 'בינונית';
      case 'Low':
        return 'נמוכה';
      default:
        return sev;
    }
  };

  const showUserTabResolved = showUserSimulationInReport(project);

  const tabs = [
    { id: 'summary' as const, label: 'תקציר מנהלים' },
    { id: 'findings' as const, label: `ממצאים והמלצות (${findings.length})` },
    {
      id: 'rawResults' as const,
      label: `תוצאות מקוריות (${expertMessages.length + userChatMessages.length + expertReviews.length})`,
    },
    ...(showUserTabResolved ? [{ id: 'userTesting' as const, label: 'סימולציית משתמשים' }] : []),
  ];

  return (
    <div className="flex flex-col min-h-full pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-1 text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)] font-medium text-sm mb-4 transition-colors"
          >
            <ChevronRightIcon size={16} /> חזרה לעמוד הבית
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">{project.name}</h1>
            <Badge variant="success">דוח חתום</Badge>
          </div>
          <p className="text-[var(--color-podium-text-secondary)] flex items-center gap-2 text-sm">
            <TargetIcon className="text-[var(--color-podium-text-tertiary)]" size={16} />
            מטרה: {project.goal}
          </p>
        </div>

        <Button icon={<DownloadIcon size={16} />}>ייצוא ל-PDF</Button>
      </header>

      <div className="flex gap-1 border-b border-[var(--color-podium-border)] mb-8 bg-[var(--color-podium-surface-muted)] p-1 rounded-t-[var(--radius-podium-lg)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-2.5 rounded-[var(--radius-podium-md)] font-semibold text-sm transition-all',
              activeTab === tab.id
                ? 'bg-white text-[var(--color-podium-primary)] shadow-[var(--shadow-podium-sm)] border border-[var(--color-podium-border)]'
                : 'text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)] hover:bg-white/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Card className="md:col-span-1 flex flex-col justify-center items-center text-center">
              <div className="relative mb-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[var(--color-podium-border)]" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                    className="text-[var(--color-podium-primary)]"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-[var(--color-podium-text)]">{overallScore}</span>
              </div>
              <h3 className="font-bold text-[var(--color-podium-text)] mt-2 text-sm">ציון חוויה משוקלל</h3>
              <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1">
                מבוסס על {project.selectedExperts.length} מומחים ו-{findings.length} ממצאים מהדיון
              </p>
              {overallExplanation && (
                <p className="text-xs text-[var(--color-podium-text-secondary)] mt-3 leading-relaxed text-right w-full px-2">
                  {overallExplanation.explanation}
                </p>
              )}
            </Card>

            <Card className="md:col-span-3">
              <h3 className="font-bold text-[var(--color-podium-text)] mb-3 text-base">שורה תחתונה מפי המומחים</h3>
              <p className="text-[var(--color-podium-text-secondary)] leading-relaxed text-sm">
                {executiveSummary}
              </p>
              {screenSummary && (
                <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-3 border-t border-[var(--color-podium-border)] pt-3">
                  סיכום מסך (Vision): {screenSummary}
                </p>
              )}
            </Card>
          </div>

          {aggregated && (aggregated.main_summary?.trim() || aggregated.top_issues.length > 0) && (
            <div className="space-y-5">
              <h3 className="font-bold text-[var(--color-podium-text)] text-lg">תוכנית פעולה מועדפת</h3>
              <Card>
                <p className="text-sm text-[var(--color-podium-text-secondary)] mb-4">{aggregated.main_summary}</p>
                {aggregated.top_issues.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-bold text-[var(--color-podium-text)]">נושאים קריטיים</h4>
                    {aggregated.top_issues.map((issue, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-surface-muted)] border border-[var(--color-podium-border)]"
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant={
                              issue.severity === 'high'
                                ? 'danger'
                                : issue.severity === 'medium'
                                  ? 'warning'
                                  : 'info'
                            }
                          >
                            {issue.severity}
                          </Badge>
                          <span className="font-semibold text-sm text-[var(--color-podium-text)]">
                            {issue.issue}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-podium-text-secondary)]">{issue.recommendation}</p>
                        {issue.mentioned_by.length > 0 && (
                          <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1">
                            מומחים: {issue.mentioned_by.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {aggregated.priority_action_plan.length > 0 && (
                  <ol className="space-y-2 list-decimal list-inside text-sm text-[var(--color-podium-text-secondary)]">
                    {aggregated.priority_action_plan.map((action) => (
                      <li key={action.priority}>
                        <span className="font-semibold text-[var(--color-podium-text)]">{action.action}</span>
                        {' — '}
                        {action.expected_impact}
                      </li>
                    ))}
                  </ol>
                )}
                {aggregated.quick_wins.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-[var(--color-podium-success)] mb-2">Quick wins</h4>
                    <ul className="text-sm text-[var(--color-podium-text-secondary)] space-y-1">
                      {aggregated.quick_wins.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}

          {expertReviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-[var(--color-podium-text)] text-lg">כרטיסי מומחים (ניתוח מובנה)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expertReviews.map((review) => (
                  <Card key={review.expert} padding="sm" className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-[var(--color-podium-text)]">{review.expert}</h4>
                      <Badge variant="primary">{review.score}/100</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-podium-text-secondary)] mb-3">{review.summary}</p>
                    {review.findings.slice(0, 2).map((f, i) => (
                      <p key={i} className="text-xs text-[var(--color-podium-text-tertiary)] mb-1">
                        • {f.issue} ({f.severity})
                      </p>
                    ))}
                    {review.open_questions.length > 0 && (
                      <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-2">
                        שאלות פתוחות: {review.open_questions.join('; ')}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h3 className="font-bold text-[var(--color-podium-text)] text-lg">ציונים לפי קטגוריות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryExplanations.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key as Exclude<ScoreCategory, 'overall'>];
              const color = CATEGORY_COLORS[cat.key as Exclude<ScoreCategory, 'overall'>];
              return (
                <Card key={cat.key} padding="sm" className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={color} size={16} />
                      <h4 className="font-bold text-[var(--color-podium-text)] text-sm">{cat.label}</h4>
                    </div>
                    <span className="text-2xl font-bold text-[var(--color-podium-text)]">{cat.score}</span>
                  </div>
                  <p className="text-sm text-[var(--color-podium-text-secondary)] leading-relaxed mb-3">
                    {cat.explanation}
                  </p>
                  {cat.factors.length > 0 && (
                    <ul className="text-xs text-[var(--color-podium-text-tertiary)] space-y-1 border-t border-[var(--color-podium-border)] pt-3">
                      {cat.factors.map((factor, i) => (
                        <li key={i}>• {factor}</li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>

          {overallExplanation && overallExplanation.factors.length > 0 && (
            <Card padding="sm" className="p-5">
              <h4 className="font-bold text-sm text-[var(--color-podium-text)] mb-2">
                גורמים שמשפיעים על הציון הכללי
              </h4>
              <ul className="text-sm text-[var(--color-podium-text-secondary)] space-y-1">
                {overallExplanation.factors.map((factor, i) => (
                  <li key={i}>• {factor}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="space-y-5 animate-in fade-in">
          {findings.length === 0 ? (
            <Card padding="lg" className="text-center text-[var(--color-podium-text-secondary)] text-sm space-y-3">
              <p>אין ממצאים בדוח זה.</p>
              {project.screenExtraction && expertMessages.length === 0 && (
                <p className="text-[var(--color-podium-text-tertiary)]">
                  ניתוח Vision הושלם, אך הדיון עם המומחים לא נשמר — כנראה הדוח הופק לפני שכל המומחים סיימו לדבר.
                </p>
              )}
              {expertMessages.length > 0 && (
                <p className="text-[var(--color-podium-text-tertiary)]">
                  יש {expertMessages.length} הודעות דיון — בדקו בטאב &quot;תוצאות מקוריות&quot;.
                </p>
              )}
              <Button size="sm" variant="secondary" onClick={() => navigate('discussion')}>
                חזרה לחדר הדיון להפקת דוח מחדש
              </Button>
            </Card>
          ) : null}
          {findings.map((finding) => (
            <Card key={finding.id} padding="none" className="overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 md:w-3/4 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={getSeverityVariant(finding.severity)}>חומרה: {getSeverityHebrew(finding.severity)}</Badge>
                  {finding.findingSource === 'user_chat' ? (
                    <Badge variant="info">מצ&apos;אט עם המומחים</Badge>
                  ) : (
                    <Badge variant="primary">מדיון ראשוני</Badge>
                  )}
                  <Badge>מיקוד: {finding.location}</Badge>
                </div>

                <h3 className="text-lg font-bold text-[var(--color-podium-text)] mt-2 mb-3">{finding.title}</h3>
                <p className="text-[var(--color-podium-text-secondary)] leading-relaxed mb-4 text-sm">{finding.description}</p>

                <div className="mt-auto bg-[var(--color-podium-primary-light)] p-4 rounded-[var(--radius-podium-lg)] border border-[var(--color-podium-primary-muted)]">
                  <h4 className="text-sm font-bold text-[var(--color-podium-primary)] mb-1 flex items-center gap-2">
                    <CheckCircleIcon size={16} />
                    המלצה אופרטיבית
                  </h4>
                  <p className="text-[var(--color-podium-text)] font-medium text-sm">{finding.recommendation}</p>
                </div>
              </div>

              <div className="bg-[var(--color-podium-surface-muted)] border-t md:border-t-0 md:border-r border-[var(--color-podium-border)] p-6 md:w-1/4 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-podium-text-tertiary)] uppercase tracking-wider mb-2 text-center md:text-right">
                    מומחים שזיהו אותה
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {finding.expertSources.map((expId) => {
                      const exp = experts.find((e) => e.id === expId);
                      if (!exp) return null;
                      return (
                        <ExpertAvatar
                          key={expId}
                          expert={exp}
                          size={36}
                          className="border border-[var(--color-podium-border)]"
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--color-podium-border)]">
                  <p className="text-xs text-[var(--color-podium-text-tertiary)] font-semibold mb-1">השפעה וסיכון:</p>
                  <p className="text-sm font-bold text-[var(--color-podium-danger)] leading-snug">{finding.impact}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'rawResults' && (
        <div className="space-y-6 animate-in fade-in">
          {expertMessages.length === 0 && expertReviews.length === 0 && userChatMessages.length === 0 ? (
            <Card padding="lg" className="text-center text-[var(--color-podium-text-secondary)] text-sm">
              <MessageIcon className="mx-auto mb-3 text-[var(--color-podium-text-tertiary)]" size={32} />
              אין תוצאות מקוריות שמורות. ודאו שהדיון הסתיים לפני הפקת הדוח.
            </Card>
          ) : (
            <>
              {expertMessages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-[var(--color-podium-text)] text-lg">
                    שיחת הדיון ({expertMessages.length} הודעות)
                  </h3>
                  {messages.map((msg) => {
                    if (msg.expertId === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <Badge variant="default">{msg.text}</Badge>
                        </div>
                      );
                    }
                    if (msg.expertId === 'user') return null;
                    const expert = experts.find((e) => e.id === msg.expertId);
                    if (!expert) return null;
                    return (
                      <Card key={msg.id} padding="sm" className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ExpertAvatar expert={expert} size={36} />
                          <div>
                            <p className="font-bold text-sm text-[var(--color-podium-text)]">{expert.name}</p>
                            <p className="text-xs text-[var(--color-podium-text-tertiary)]">
                              {expert.role} • {msg.timestamp}
                              {msg.type !== 'observation' && ` • ${msg.type}`}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--color-podium-text-secondary)] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              )}

              {userChatMessages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-[var(--color-podium-text)] text-lg">
                    צ&apos;אט עם המומחים ({userChatMessages.length} הודעות)
                  </h3>
                  {userChatMessages.map((msg) => {
                    if (msg.expertId === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <Badge variant="warning">{msg.text}</Badge>
                        </div>
                      );
                    }
                    if (msg.expertId === 'user') {
                      return (
                        <Card key={msg.id} padding="sm" className="p-4 bg-[var(--color-podium-primary-light)]">
                          <p className="text-xs font-semibold text-[var(--color-podium-primary)] mb-1">את/ה</p>
                          <p className="text-sm text-[var(--color-podium-text)] whitespace-pre-wrap">{msg.text}</p>
                        </Card>
                      );
                    }
                    const expert = experts.find((e) => e.id === msg.expertId);
                    if (!expert) return null;
                    return (
                      <Card key={msg.id} padding="sm" className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ExpertAvatar expert={expert} size={36} />
                          <div>
                            <p className="font-bold text-sm text-[var(--color-podium-text)]">{expert.name}</p>
                            <p className="text-xs text-[var(--color-podium-text-tertiary)]">{msg.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--color-podium-text-secondary)] whitespace-pre-wrap">{msg.text}</p>
                      </Card>
                    );
                  })}
                </div>
              )}

              {expertReviews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-[var(--color-podium-text)] text-lg">
                    ניתוחי מומחים מובנים ({expertReviews.length})
                  </h3>
                  {expertReviews.map((review) => (
                    <Card key={review.expert} padding="sm" className="p-5">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h4 className="font-bold text-[var(--color-podium-text)]">{review.expert}</h4>
                        <Badge variant="primary">ציון: {review.score}/100</Badge>
                      </div>
                      <p className="text-sm text-[var(--color-podium-text-secondary)] leading-relaxed mb-4 whitespace-pre-wrap">
                        {review.summary}
                      </p>
                      {review.findings.length > 0 && (
                        <div className="space-y-3 border-t border-[var(--color-podium-border)] pt-4">
                          <h5 className="text-sm font-bold text-[var(--color-podium-text)]">ממצאים</h5>
                          {review.findings.map((f, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-surface-muted)] text-sm"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}>
                                  {f.severity}
                                </Badge>
                                <span className="font-semibold text-[var(--color-podium-text)]">{f.issue}</span>
                              </div>
                              {f.evidence_from_screen && (
                                <p className="text-[var(--color-podium-text-secondary)] mb-1">
                                  <span className="font-semibold">ראיה:</span> {f.evidence_from_screen}
                                </p>
                              )}
                              {f.why_it_matters && (
                                <p className="text-[var(--color-podium-text-secondary)] mb-1">
                                  <span className="font-semibold">למה זה חשוב:</span> {f.why_it_matters}
                                </p>
                              )}
                              {f.recommendation && (
                                <p className="text-[var(--color-podium-text)]">
                                  <span className="font-semibold">המלצה:</span> {f.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {review.quick_wins.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-bold text-[var(--color-podium-success)] mb-1">Quick wins</h5>
                          <ul className="text-sm text-[var(--color-podium-text-secondary)] space-y-1">
                            {review.quick_wins.map((w, i) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.open_questions.length > 0 && (
                        <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-3">
                          שאלות פתוחות: {review.open_questions.join('; ')}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {screenSummary && (
                <Card padding="sm" className="p-4">
                  <h4 className="font-bold text-sm text-[var(--color-podium-text)] mb-2">סיכום Vision (מקור)</h4>
                  <p className="text-sm text-[var(--color-podium-text-secondary)]">{screenSummary}</p>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'userTesting' && (
        <Card padding="lg" className="flex flex-col items-center justify-center text-center min-h-[300px] animate-in fade-in">
          <UsersIcon className="text-[var(--color-podium-primary)]/30 mb-4" size={56} />
          <h2 className="text-xl font-bold text-[var(--color-podium-text)] mb-2">סימולציית משתמשים</h2>
          <p className="text-[var(--color-podium-text-secondary)] max-w-lg mb-6 text-sm">
            {project.personaRuns?.length
              ? `${project.personaRuns.length} פרסונות נותחו לפי מתודולוגיית 9 השלבים.`
              : 'תוצאות סימולציה זמינות בדוח בדיקת משתמשים.'}
          </p>
          {project.reviewKind === 'user' && (
            <Button onClick={() => navigate('user-simulation')}>צפייה בתוצאות מלאות</Button>
          )}
        </Card>
      )}
    </div>
  );
}
