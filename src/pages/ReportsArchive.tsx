import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getReviewKind } from '../lib/projectKind';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExpertAvatar } from '../components/ui/ExpertAvatar';
import { ArrowLeftIcon, PlayIcon, UsersIcon } from '../components/icons';
import { cn } from '../lib/utils';
import { formatProjectDate } from '../lib/formatDate';
import type { ReviewProject } from '../types';

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

type ArchiveTab = 'expert' | 'user';

function ProjectList({
  projects,
  experts,
  onOpen,
  emptyLabel,
  emptyCta,
}: {
  projects: ReviewProject[];
  experts: ReturnType<typeof useAppContext>['experts'];
  onOpen: (projectId: string, route: 'discussion' | 'report' | 'user-simulation') => void;
  emptyLabel: string;
  emptyCta: { label: string; route: string };
}) {
  const { navigate } = useAppContext();

  if (projects.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-[var(--color-podium-text-secondary)] mb-4">{emptyLabel}</p>
        <Button onClick={() => navigate(emptyCta.route)} icon={<PlayIcon className="fill-current" size={16} />}>
          {emptyCta.label}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const isUser = getReviewKind(project) === 'user';
        const completedRoute = isUser ? 'user-simulation' : 'report';

        return (
          <Card
            key={project.id}
            className="flex flex-col md:flex-row md:items-center gap-4 hover:shadow-[var(--shadow-podium-md)] transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-base font-bold text-[var(--color-podium-text)]">{project.name}</h3>
                <Badge>{project.domain || (isUser ? 'משתמשים' : 'מומחים')}</Badge>
                <Badge variant={isUser ? 'info' : 'primary'}>{isUser ? 'בדיקת משתמשים' : 'בדיקת מומחים'}</Badge>
                <Badge variant={project.status === 'completed' ? 'success' : 'default'}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-podium-text-secondary)] truncate">מטרה: {project.goal}</p>
              <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-1">
                {TEST_TYPE_LABELS[project.testType] ?? project.testType} • {formatProjectDate(project)}
              </p>
              {!isUser && (
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
              )}
              {isUser && (
                <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-3 flex items-center gap-1">
                  <UsersIcon size={14} />
                  {project.personas?.length ?? 2} פרסונות
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {project.status === 'completed' && <StatusBadge status="success" label="דוח מוכן" />}
              {project.status === 'running' && !isUser && (
                <Button size="sm" variant="secondary" onClick={() => onOpen(project.id, 'discussion')}>
                  המשך דיון
                </Button>
              )}
              {project.status === 'completed' && (
                <Button size="sm" onClick={() => onOpen(project.id, completedRoute)}>
                  {isUser ? 'צפייה בסימולציה' : 'צפייה בדוח'}
                </Button>
              )}
              <button
                type="button"
                onClick={() => onOpen(project.id, project.status === 'completed' ? completedRoute : 'discussion')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-primary-light)] hover:text-[var(--color-podium-primary)] transition-colors border border-[var(--color-podium-border)]"
              >
                <ArrowLeftIcon size={16} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function ReportsArchive() {
  const { projects, experts, navigate, setCurrentProjectId } = useAppContext();
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>('expert');

  const expertProjects = projects.filter((p) => getReviewKind(p) === 'expert');
  const userProjects = projects.filter((p) => getReviewKind(p) === 'user');

  const openProject = (projectId: string, route: 'discussion' | 'report' | 'user-simulation') => {
    setCurrentProjectId(projectId);
    navigate(route);
  };

  const tabs: { id: ArchiveTab; label: string; count: number }[] = [
    { id: 'expert', label: 'בדיקות מומחים', count: expertProjects.length },
    { id: 'user', label: 'בדיקות משתמשים', count: userProjects.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">ארכיון בדיקות</h1>
        <p className="text-[var(--color-podium-text-secondary)] mt-1 text-sm">
          {projects.length} בדיקות שמורות — {expertProjects.length} מומחים, {userProjects.length} משתמשים.
        </p>
      </header>

      <div className="flex gap-1 border-b border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)] p-1 rounded-t-[var(--radius-podium-lg)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setArchiveTab(tab.id)}
            className={cn(
              'px-5 py-2.5 rounded-[var(--radius-podium-md)] font-semibold text-sm transition-all',
              archiveTab === tab.id
                ? 'bg-white text-[var(--color-podium-primary)] shadow-[var(--shadow-podium-sm)] border border-[var(--color-podium-border)]'
                : 'text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)] hover:bg-white/50'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {archiveTab === 'expert' ? (
        <ProjectList
          projects={expertProjects}
          experts={experts}
          onOpen={openProject}
          emptyLabel="עדיין אין בדיקות מומחים"
          emptyCta={{ label: 'התחלת בדיקת מומחים', route: 'expert-test' }}
        />
      ) : (
        <ProjectList
          projects={userProjects}
          experts={experts}
          onOpen={openProject}
          emptyLabel="עדיין אין בדיקות משתמשים"
          emptyCta={{ label: 'התחלת בדיקת משתמשים', route: 'user-test' }}
        />
      )}
    </div>
  );
}
