import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { retryPersonaRun } from '../../lib/userSimulation/runSimulation';
import { SimulationAnalysisSections } from '../../components/userTest/SimulationAnalysisSections';
import { ChevronRightIcon, UsersIcon } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

export function UserSimulationView() {
  const { currentProjectId, projects, navigate, updateProject, llmSettings } = useAppContext();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const project = projects.find((p) => p.id === currentProjectId);

  if (!project) return <div>בדיקה לא נמצאה</div>;

  const runs = project.personaRuns ?? [];
  const activeRun = runs.find((r) => r.id === activeRunId) ?? runs[0];
  const isRunning = project.simulationStatus === 'running' || project.status === 'running';

  const handleRetry = async (runId: string) => {
    setRetrying(runId);
    try {
      const updatedRuns = await retryPersonaRun(project, runId, llmSettings);
      updateProject(project.id, {
        personaRuns: updatedRuns,
        simulationStatus: updatedRuns.every((r) => r.status === 'completed') ? 'completed' : 'error',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'שגיאה בניסיון חוזר');
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12 animate-in fade-in">
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate('reports')}
          className="flex items-center gap-1 text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)] font-medium text-sm mb-4 transition-colors"
        >
          <ChevronRightIcon size={16} /> חזרה לארכיון
        </button>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-2xl font-bold text-[var(--color-podium-text)]">{project.name}</h1>
          <Badge variant="info">בדיקת משתמשים</Badge>
          <Badge variant={project.simulationStatus === 'completed' ? 'success' : isRunning ? 'warning' : 'default'}>
            {isRunning ? 'מריץ...' : project.simulationStatus === 'completed' ? 'הושלם' : project.simulationStatus === 'error' ? 'שגיאה חלקית' : project.status}
          </Badge>
        </div>
        <p className="text-[var(--color-podium-text-secondary)] text-sm">מטרה: {project.goal || '—'}</p>
        {project.userTasks?.length ? (
          <p className="text-xs text-[var(--color-podium-text-tertiary)] mt-2">
            משימות: {project.userTasks.join(' • ')}
          </p>
        ) : null}
      </header>

      {runs.length === 0 && (
        <Card padding="lg" className="text-center">
          <UsersIcon className="mx-auto mb-4 text-[var(--color-podium-primary)]/30" size={48} />
          <p className="text-[var(--color-podium-text-secondary)]">אין תוצאות סימולציה לבדיקה זו (פרויקט ישן).</p>
          <Button className="mt-4" onClick={() => navigate('user-test')}>
            בדיקה חדשה
          </Button>
        </Card>
      )}

      {runs.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--color-podium-border)] pb-3">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setActiveRunId(run.id)}
                className={cn(
                  'px-4 py-2 rounded-[var(--radius-podium-md)] text-sm font-semibold transition-colors',
                  (activeRun?.id === run.id)
                    ? 'bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)]'
                    : 'text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-surface-muted)]'
                )}
              >
                {run.personaSnapshot.name}
                {run.status === 'error' && ' ⚠'}
                {run.status === 'completed' && ' ✓'}
              </button>
            ))}
          </div>

          {activeRun?.status === 'error' && (
            <Card className="mb-4 border-[var(--color-podium-danger)] bg-[var(--color-podium-danger-bg)]">
              <p className="text-sm text-[var(--color-podium-danger)] font-semibold mb-2">
                {activeRun.error ?? 'שגיאה בניתוח'}
              </p>
              <Button size="sm" onClick={() => handleRetry(activeRun.id)} disabled={retrying === activeRun.id}>
                {retrying === activeRun.id ? 'מנסה שוב...' : 'נסה שוב'}
              </Button>
            </Card>
          )}

          {activeRun?.analysis && (
            <SimulationAnalysisSections
              analysis={activeRun.analysis}
              personaName={activeRun.personaSnapshot.name}
            />
          )}

          {activeRun && !activeRun.analysis && activeRun.status !== 'error' && (
            <Card padding="lg" className="text-center text-[var(--color-podium-text-secondary)]">
              {isRunning ? 'הניתוח עדיין רץ...' : 'אין ניתוח זמין'}
            </Card>
          )}
        </>
      )}

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={() => navigate('user-test')}>
          בדיקה חדשה
        </Button>
        <Button variant="ghost" onClick={() => navigate('persona-library')}>
          מאגר פרסונות
        </Button>
      </div>
    </div>
  );
}
