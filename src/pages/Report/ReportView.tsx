import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../AppContext';
import { buildExecutiveSummary } from '../../lib/reportFromDiscussion';
import { showUserSimulationInReport } from '../../lib/projectKind';
import {
  ChevronRightIcon,
  DownloadIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../../components/icons';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';

export function ReportView() {
  const { currentProjectId, projects, navigate, experts } = useAppContext();
  const project = projects.find((p) => p.id === currentProjectId);
  const [activeTab, setActiveTab] = useState<'summary' | 'findings' | 'userTesting'>('summary');

  if (!project) return <div>Project not found</div>;

  const findings = project.findings ?? [];
  const overallScore = project.scores?.overall ?? 72;
  const executiveSummary =
    project.executiveSummary ?? buildExecutiveSummary(findings, experts, project);
  const aggregated = project.aggregatedReport;
  const expertReviews = project.expertReviews ?? [];
  const screenSummary = project.screenExtraction?.screen_summary;

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

  const showUserTab = showUserSimulationInReport(project);

  useEffect(() => {
    if (!showUserTab && activeTab === 'userTesting') {
      setActiveTab('summary');
    }
  }, [showUserTab, activeTab]);

  const tabs = [
    { id: 'summary' as const, label: 'תקציר מנהלים' },
    { id: 'findings' as const, label: `ממצאים והמלצות (${findings.length})` },
    ...(showUserTab ? [{ id: 'userTesting' as const, label: 'סימולציית משתמשים' }] : []),
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

          {aggregated && (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
              { label: 'בהירות ומסרים', score: project.scores?.clarity ?? 85, color: 'text-[var(--color-podium-success)]', icon: CheckCircleIcon },
              { label: 'שימושיות וזרימה', score: project.scores?.usability ?? 75, color: 'text-[var(--color-podium-info)]', icon: TrendingUpIcon },
              { label: 'אמון וביטחון', score: project.scores?.trust ?? 62, color: 'text-[var(--color-podium-warning)]', icon: AlertTriangleIcon },
              { label: 'נגישות', score: project.scores?.accessibility ?? 65, color: 'text-[var(--color-podium-warning)]', icon: AlertTriangleIcon },
            ].map((cat) => (
              <Card key={cat.label} padding="sm" className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon className={cat.color} size={16} />
                  <h4 className="font-bold text-[var(--color-podium-text)] text-sm">{cat.label}</h4>
                </div>
                <span className="text-2xl font-bold text-[var(--color-podium-text)]">{cat.score}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="space-y-5 animate-in fade-in">
          {findings.length === 0 ? (
            <Card padding="lg" className="text-center text-[var(--color-podium-text-secondary)] text-sm">
              אין ממצאים בדוח זה. הפיקו דוח רק לאחר דיון שהסתיים, כדי שהתובנות יישמרו מהשיחה בין המומחים.
            </Card>
          ) : null}
          {findings.map((finding) => (
            <Card key={finding.id} padding="none" className="overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 md:w-3/4 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={getSeverityVariant(finding.severity)}>חומרה: {getSeverityHebrew(finding.severity)}</Badge>
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

      {activeTab === 'userTesting' && (
        <Card padding="lg" className="flex flex-col items-center justify-center text-center min-h-[400px] animate-in fade-in">
          <UsersIcon className="text-[var(--color-podium-primary)]/30 mb-4" size={56} />
          <h2 className="text-xl font-bold text-[var(--color-podium-text)] mb-2">סימולציית משתמשים התנהגותית</h2>
          <p className="text-[var(--color-podium-text-secondary)] max-w-lg mb-6 text-sm">
            בבדיקה זו סומלצו 2 פרסונות, המשקפות התנהגויות קצה שהוגדרו מראש. הממצאים שוקללו אל תוך הדוח.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-right">
            <Card padding="sm" className="p-4">
              <h4 className="font-bold text-[var(--color-podium-text)] mb-2 text-sm">משתמשת 1: לחוצה בזמן</h4>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">הצלחת משימה:</span>
                  <span className="font-bold text-[var(--color-podium-warning)]">60%</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">סיכוי נטישה:</span>
                  <span className="font-bold text-[var(--color-podium-danger)]">גבוה</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">חסם עיקרי:</span>
                  <span className="font-bold text-[var(--color-podium-text)]">עומס קריאה</span>
                </p>
              </div>
            </Card>
            <Card padding="sm" className="p-4">
              <h4 className="font-bold text-[var(--color-podium-text)] mb-2 text-sm">משתמש 2: חושש מהתחייבות</h4>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">הצלחת משימה:</span>
                  <span className="font-bold text-[var(--color-podium-success)]">90%</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">סיכוי נטישה:</span>
                  <span className="font-bold text-[var(--color-podium-warning)]">בינוני</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[var(--color-podium-text-secondary)]">חסם עיקרי:</span>
                  <span className="font-bold text-[var(--color-podium-text)]">ניסוח כפתור סיום</span>
                </p>
              </div>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}
