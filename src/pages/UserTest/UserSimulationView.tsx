import React from 'react';
import { useAppContext } from '../../AppContext';
import { DEFAULT_USER_PERSONAS } from '../../data/defaultPersonas';
import { ChevronRightIcon, UsersIcon } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const DEMO_RESULTS = [
  {
    personaId: 'persona-rushed',
    taskSuccess: '60%',
    churnRisk: 'גבוה',
    blocker: 'עומס קריאה',
  },
  {
    personaId: 'persona-cautious',
    taskSuccess: '90%',
    churnRisk: 'בינוני',
    blocker: 'ניסוח כפתור סיום',
  },
];

export function UserSimulationView() {
  const { currentProjectId, projects, navigate } = useAppContext();
  const project = projects.find((p) => p.id === currentProjectId);

  if (!project) return <div>בדיקה לא נמצאה</div>;

  const personas = project.personas?.length ? project.personas : DEFAULT_USER_PERSONAS;

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
          <Badge variant={project.status === 'completed' ? 'success' : 'default'}>
            {project.status === 'completed' ? 'הושלם' : 'בתהליך'}
          </Badge>
        </div>
        <p className="text-[var(--color-podium-text-secondary)] text-sm">מטרה: {project.goal}</p>
      </header>

      <Card padding="lg" className="flex flex-col items-center text-center min-h-[400px]">
        <UsersIcon className="text-[var(--color-podium-primary)]/30 mb-4" size={56} />
        <h2 className="text-xl font-bold text-[var(--color-podium-text)] mb-2">סימולציית משתמשים התנהגותית</h2>
        <p className="text-[var(--color-podium-text-secondary)] max-w-lg mb-6 text-sm">
          סומלצו {personas.length} פרסונות לפי קהל היעד שהוגדר. הממצאים נשמרים בדוח בדיקת המשתמשים.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-right">
          {personas.map((persona, index) => {
            const demo = DEMO_RESULTS[index] ?? DEMO_RESULTS[0];
            return (
              <Card key={persona.id} padding="sm" className="p-4 text-right">
                <h4 className="font-bold text-[var(--color-podium-text)] mb-2 text-sm">{persona.title}</h4>
                <p className="text-xs text-[var(--color-podium-text-secondary)] mb-3 leading-relaxed">{persona.description}</p>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between gap-2">
                    <span className="text-[var(--color-podium-text-secondary)]">הצלחת משימה:</span>
                    <span className="font-bold text-[var(--color-podium-warning)]">{demo.taskSuccess}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-[var(--color-podium-text-secondary)]">סיכוי נטישה:</span>
                    <span className="font-bold text-[var(--color-podium-danger)]">{demo.churnRisk}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-[var(--color-podium-text-secondary)]">חסם עיקרי:</span>
                    <span className="font-bold text-[var(--color-podium-text)]">{demo.blocker}</span>
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
        <Button className="mt-8" onClick={() => navigate('user-test')}>
          בדיקת משתמשים חדשה
        </Button>
      </Card>
    </div>
  );
}
