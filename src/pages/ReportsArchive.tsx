import React from 'react';
import { useAppContext } from '../AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExpertAvatar } from '../components/ui/ExpertAvatar';
import { ArrowLeftIcon, PlayIcon } from '../components/icons';

const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  running: 'בתהליך',
  completed: 'הושלם',
};

const TEST_TYPE_LABELS: Record<string, string> = {
  live_site: 'אתר חי',
  static_design: 'עיצוב סטטי',
  flow: 'תהליך',
  video: 'וידאו',
  prototype: 'פרוטוטיפ',
  prd: 'PRD',
  comparison: 'השוואה',
  retest: 'בדיקה חוזרת',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ReportsArchive() {
  const { projects, experts, navigate, setCurrentProjectId } = useAppContext();

  const openProject = (projectId: string, route: 'discussion' | 'report') => {
    setCurrentProjectId(projectId);
    navigate(route);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">ארכיון בדיקות</h1>
        <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
          כל הבדיקות שביצעתם נשמרות אוטומטית. {projects.length} בדיקות בארכיון.
        </p>
      </header>

      {projects.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-[var(--color-podium-text-secondary)] mb-4">עדיין אין בדיקות שמורות</p>
          <Button onClick={() => navigate('new-test')} icon={<PlayIcon className="fill-current" size={16} />}>
            התחלת בדיקה חדשה
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col md:flex-row md:items-center gap-4 hover:shadow-[var(--shadow-podium-md)] transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="text-base font-bold text-[var(--color-podium-text)]">{project.name}</h3>
                  <Badge>{project.domain}</Badge>
                  <Badge variant={project.status === 'completed' ? 'success' : 'default'}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-podium-text-secondary)] truncate">
                  מטרה: {project.goal}
                </p>
                <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1">
                  {TEST_TYPE_LABELS[project.testType] ?? project.testType} • {formatDate(project.createdAt)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2 space-x-reverse">
                    {project.selectedExperts.slice(0, 5).map((expertId, i) => {
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
                  <span className="text-xs text-[var(--color-podium-text-tertiary)]">
                    {project.selectedExperts.length} מומחים
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {project.status === 'completed' && (
                  <StatusBadge status="success" label="דוח מוכן" />
                )}
                {project.status === 'running' && (
                  <Button size="sm" variant="secondary" onClick={() => openProject(project.id, 'discussion')}>
                    המשך דיון
                  </Button>
                )}
                {project.status === 'completed' && (
                  <Button size="sm" onClick={() => openProject(project.id, 'report')}>
                    צפייה בדוח
                  </Button>
                )}
                {project.messages && project.messages.length > 0 && project.status !== 'completed' && (
                  <Button size="sm" variant="ghost" onClick={() => openProject(project.id, 'discussion')}>
                    דיון
                  </Button>
                )}
                <button
                  onClick={() => openProject(project.id, project.status === 'completed' ? 'report' : 'discussion')}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-primary-light)] hover:text-[var(--color-podium-primary)] transition-colors border border-[var(--color-podium-border)]"
                >
                  <ArrowLeftIcon size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
