import React from 'react';
import { useAppContext } from '../AppContext';
import { PlayIcon, TrendingUpIcon, CheckCircleIcon, AlertTriangleIcon, ArrowLeftIcon, DashboardIcon } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExpertAvatar } from '../components/ui/ExpertAvatar';

export function Dashboard() {
  const { projects, navigate, setCurrentProjectId, experts } = useAppContext();

  const handleOpenReport = (id: string) => {
    setCurrentProjectId(id);
    navigate('report');
  };

  const stats = [
    {
      title: 'בדיקות שהושלמו',
      value: '12',
      trend: '+3 מול שבוע שעבר',
      trendUp: true,
      icon: CheckCircleIcon,
      iconBg: 'bg-[var(--color-podium-success-bg)]',
      iconColor: 'text-[var(--color-podium-success)]',
    },
    {
      title: 'ממצאים קריטיים',
      value: '4',
      trend: 'ממתינים לטיפול ב-2 פרויקטים',
      trendUp: false,
      icon: AlertTriangleIcon,
      iconBg: 'bg-[var(--color-podium-danger-bg)]',
      iconColor: 'text-[var(--color-podium-danger)]',
    },
    {
      title: 'ציון שימושיות ממוצע',
      value: '78',
      suffix: '/100',
      trend: 'עלייה של 4 נקודות מהרבעון הקודם',
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
          <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
            יש לכם בדיקה אחת שהסתיימה השבוע ועוד 14 הערות ממתינות להתייחסות.
          </p>
        </div>
        <Button
          onClick={() => navigate('new-test')}
          size="lg"
          icon={<PlayIcon className="fill-current" size={16} />}
        >
          התחלת בדיקה חדשה
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
            <p className={`text-xs font-medium flex items-center gap-1 ${stat.trendUp ? 'text-[var(--color-podium-success)]' : stat.title.includes('קריטיים') ? 'text-[var(--color-podium-danger)]' : 'text-[var(--color-podium-text-secondary)]'}`}>
              {stat.trendUp && <TrendingUpIcon size={14} />}
              {stat.trend}
            </p>
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <CardHeader>
          <h2 className="text-base font-bold text-[var(--color-podium-text)]">בדיקות אחרונות</h2>
          <button
            onClick={() => navigate('reports')}
            className="text-sm font-semibold text-[var(--color-podium-primary)] hover:text-[var(--color-podium-primary-hover)] transition-colors"
          >
            צפייה בכל הבדיקות
          </button>
        </CardHeader>
        <div className="divide-y divide-[var(--color-podium-border)]">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-5 flex flex-col md:flex-row items-center justify-between hover:bg-[var(--color-podium-surface-muted)] transition-colors group cursor-pointer"
              onClick={() => handleOpenReport(project.id)}
            >
              <div className="flex-1 min-w-0 mb-4 md:mb-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-bold text-[var(--color-podium-text)] truncate">{project.name}</h3>
                  <Badge>{project.domain}</Badge>
                </div>
                <p className="text-sm text-[var(--color-podium-text-secondary)] truncate mt-1">
                  מטרה: {project.goal}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2 space-x-reverse">
                    {project.selectedExperts.map((expertId, i) => {
                      const expert = experts.find((e) => e.id === expertId);
                      if (!expert) return null;
                      return (
                        <ExpertAvatar
                          key={expert.id}
                          expert={expert}
                          size={28}
                          className="border-2 border-white relative"
                          style={{ zIndex: 10 - i }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-[var(--color-podium-text-tertiary)] mr-2">
                    צוות של {project.selectedExperts.length} מומחים
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-[var(--color-podium-text-secondary)]">הושלם לפני יומיים</span>
                  <StatusBadge status="success" label="הדוח מוכן" />
                </div>

                <button className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] group-hover:bg-[var(--color-podium-primary-light)] group-hover:text-[var(--color-podium-primary)] transition-colors border border-[var(--color-podium-border)]">
                  <ArrowLeftIcon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
