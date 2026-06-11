import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getReviewKind } from '../lib/projectKind';
import { ProjectList } from '../components/ProjectList';
import { cn } from '../lib/utils';

type ArchiveTab = 'expert' | 'user';

export function ReportsArchive() {
  const { projects, experts, navigate, setCurrentProjectId, duplicateProject, deleteProject } =
    useAppContext();
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
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          emptyLabel="עדיין אין בדיקות מומחים"
          emptyCta={{ label: 'התחלת בדיקת מומחים', route: 'expert-test' }}
        />
      ) : (
        <ProjectList
          projects={userProjects}
          experts={experts}
          onOpen={openProject}
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          emptyLabel="עדיין אין בדיקות משתמשים"
          emptyCta={{ label: 'התחלת בדיקת משתמשים', route: 'user-test' }}
        />
      )}
    </div>
  );
}
