import React from 'react';
import { useAppContext } from '../AppContext';
import { getReviewKind } from '../lib/projectKind';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { StatusBadge } from './ui/StatusBadge';
import { ExpertAvatar } from './ui/ExpertAvatar';
import { ArrowLeftIcon, DuplicateIcon, PlayIcon, TrashIcon, UsersIcon } from './icons';
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

export type ProjectOpenRoute = 'discussion' | 'report' | 'user-simulation';

type ProjectListProps = {
  projects: ReviewProject[];
  experts: ReturnType<typeof useAppContext>['experts'];
  onOpen: (projectId: string, route: ProjectOpenRoute) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  emptyLabel: string;
  emptyCta: { label: string; route: string };
};

export function ProjectList({
  projects,
  experts,
  onOpen,
  onDuplicate,
  onDelete,
  emptyLabel,
  emptyCta,
}: ProjectListProps) {
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
                  {project.personas?.length ?? project.personaRuns?.length ?? 0} פרסונות
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
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
              <Button
                size="sm"
                variant="secondary"
                icon={<DuplicateIcon size={16} />}
                onClick={() => onDuplicate(project.id)}
                title="שכפול הגדרות הבדיקה"
              >
                שכפל
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`למחוק את "${project.name}"?\nפעולה זו לא ניתנת לביטול.`)) {
                    onDelete(project.id);
                  }
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-danger-bg)] hover:text-[var(--color-podium-danger)] transition-colors border border-[var(--color-podium-border)]"
                title="מחיקת בדיקה"
              >
                <TrashIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => onOpen(project.id, project.status === 'completed' ? completedRoute : 'discussion')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-primary-light)] hover:text-[var(--color-podium-primary)] transition-colors border border-[var(--color-podium-border)]"
                title="פתיחה"
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
