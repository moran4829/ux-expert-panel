import React, { useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { computeDashboardStats, sortProjectsByRecency } from '../lib/dashboardStats';
import { ProjectList } from '../components/ProjectList';
import { PlayIcon, TrendingUpIcon, CheckCircleIcon, AlertTriangleIcon, DashboardIcon } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

function buildSubtitle(stats: ReturnType<typeof computeDashboardStats>): string {
  const parts: string[] = [];

  if (stats.completedThisWeek > 0) {
    parts.push(
      stats.completedThisWeek === 1
        ? 'יש לכם בדיקה אחת שהסתיימה השבוע'
        : `יש לכם ${stats.completedThisWeek} בדיקות שהסתיימו השבוע`
    );
  } else if (stats.completedCount > 0) {
    parts.push('עדיין לא הושלמו בדיקות השבוע');
  } else {
    parts.push('עדיין אין בדיקות שהושלמו במערכת');
  }

  if (stats.pendingFindingsCount > 0) {
    parts.push(
      stats.pendingFindingsCount === 1
        ? 'ועוד הערה אחת ממתינה להתייחסות'
        : `ועוד ${stats.pendingFindingsCount} הערות ממתינות להתייחסות`
    );
  }

  return parts.join(' ');
}

export function Dashboard() {
  const { projects, navigate, setCurrentProjectId, experts, duplicateProject, deleteProject } = useAppContext();

  const statsData = useMemo(() => computeDashboardStats(projects, experts), [projects, experts]);
  const recentProjects = useMemo(() => sortProjectsByRecency(projects).slice(0, 5), [projects]);

  const openProject = (projectId: string, route: 'discussion' | 'report' | 'user-simulation') => {
    setCurrentProjectId(projectId);
    navigate(route);
  };

  const completedTrendDiff = statsData.completedThisWeek - statsData.completedLastWeek;
  const completedTrend =
    completedTrendDiff > 0
      ? `+${completedTrendDiff} מול שבוע שעבר`
      : completedTrendDiff < 0
        ? `${completedTrendDiff} מול שבוע שעבר`
        : statsData.completedCount > 0
          ? 'אין שינוי משבוע שעבר'
          : 'התחילו בדיקה ראשונה';

  const criticalTrend =
    statsData.criticalFindingsCount > 0
      ? statsData.highOrCriticalProjectsCount === 1
        ? 'בפרויקט אחד'
        : `ב-${statsData.highOrCriticalProjectsCount} פרויקטים`
      : 'אין ממצאים קריטיים';

  const usabilityTrend =
    statsData.usabilityTrendDelta === null
      ? statsData.avgUsability === null
        ? 'אין עדיין ציוני שימושיות'
        : 'מבוסס על בדיקות שהושלמו'
      : statsData.usabilityTrendDelta > 0
        ? `עלייה של ${statsData.usabilityTrendDelta} נקודות מהממוצע הקודם`
        : statsData.usabilityTrendDelta < 0
          ? `ירידה של ${Math.abs(statsData.usabilityTrendDelta)} נקודות מהממוצע הקודם`
          : 'יציב ביחס לבדיקות קודמות';

  const stats = [
    {
      title: 'בדיקות שהושלמו',
      value: String(statsData.completedCount),
      trend: completedTrend,
      trendUp: completedTrendDiff > 0,
      icon: CheckCircleIcon,
      iconBg: 'bg-[var(--color-podium-success-bg)]',
      iconColor: 'text-[var(--color-podium-success)]',
    },
    {
      title: 'ממצאים קריטיים',
      value: String(statsData.criticalFindingsCount),
      trend: criticalTrend,
      trendUp: false,
      icon: AlertTriangleIcon,
      iconBg: 'bg-[var(--color-podium-danger-bg)]',
      iconColor: 'text-[var(--color-podium-danger)]',
    },
    {
      title: 'ציון שימושיות ממוצע',
      value: statsData.avgUsability === null ? '—' : String(statsData.avgUsability),
      suffix: statsData.avgUsability === null ? undefined : '/100',
      trend: usabilityTrend,
      trendUp: (statsData.usabilityTrendDelta ?? 0) > 0,
      icon: DashboardIcon,
      iconBg: 'bg-[var(--color-podium-info-bg)]',
      iconColor: 'text-[var(--color-podium-info)]',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-podium-text)] tracking-tight">שלום, צוות מוצר 👋</h1>
          <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">{buildSubtitle(statsData)}</p>
        </div>
        <Button
          onClick={() => navigate('expert-test')}
          size="lg"
          icon={<PlayIcon className="fill-current rotate-180" size={16} />}
        >
          בדיקת מומחים חדשה
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-podium-text)] text-sm">{stat.title}</h3>
              <div className={`w-9 h-9 rounded-[var(--radius-podium-md)] ${stat.iconBg} ${stat.iconColor} flex items-center justify-center`}>
                {stat.icon ? (
                  <stat.icon size={18} />
                ) : (
                  <span className="text-xs font-bold">UX</span>
                )}
              </div>
            </div>
            <p className="text-3xl font-bold text-[var(--color-podium-text)] mb-2">
              {stat.value}
              {stat.suffix && <span className="text-lg text-[var(--color-podium-text-tertiary)]">{stat.suffix}</span>}
            </p>
            <p
              className={`text-xs font-medium flex items-center gap-1 ${
                stat.trendUp
                  ? 'text-[var(--color-podium-success)]'
                  : stat.title.includes('קריטיים')
                    ? 'text-[var(--color-podium-danger)]'
                    : 'text-[var(--color-podium-text-secondary)]'
              }`}
            >
              {stat.trendUp && <TrendingUpIcon size={14} />}
              {stat.trend}
            </p>
          </Card>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--color-podium-text)]">בדיקות אחרונות</h2>
          <button
            onClick={() => navigate('reports')}
            className="text-sm font-semibold text-[var(--color-podium-primary)] hover:text-[var(--color-podium-primary-hover)] transition-colors"
          >
            צפייה בכל הבדיקות
          </button>
        </div>

        <ProjectList
          projects={recentProjects}
          experts={experts}
          onOpen={openProject}
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          emptyLabel="אין בדיקות עדיין"
          emptyCta={{ label: 'התחלת בדיקת מומחים', route: 'expert-test' }}
        />
      </section>
    </div>
  );
}
