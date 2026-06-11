import React from 'react';
import type { UXMethodologyResult } from '../../types/userSimulation';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

type SimulationAnalysisSectionsProps = {
  analysis: UXMethodologyResult;
  personaName?: string;
};

function Section({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" className="space-y-3">
      <h3 className="font-bold text-[var(--color-podium-text)] flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)] text-xs font-bold flex items-center justify-center">
          {num}
        </span>
        {title}
      </h3>
      {children}
    </Card>
  );
}

export function SimulationAnalysisSections({ analysis, personaName }: SimulationAnalysisSectionsProps) {
  return (
    <div className="space-y-5">
      {personaName && (
        <p className="text-sm text-[var(--color-podium-text-secondary)]">
          ניתוח עבור: <strong>{personaName}</strong>
        </p>
      )}

      <Section num={1} title="הגדרת הקשר">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--color-podium-text-tertiary)] mb-1">מטרת המסך</p>
            <p className="text-[var(--color-podium-text)]">{analysis.contextGoal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--color-podium-text-tertiary)] mb-1">מחויבות רגשית</p>
            <p className="text-[var(--color-podium-text)]">{analysis.userCommitmentLevel}</p>
          </div>
        </div>
      </Section>

      <Section num={2} title="היררכיית קשב">
        <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
          <div className="p-3 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-surface-muted)] text-center">
            <p className="text-xs text-[var(--color-podium-text-tertiary)]">ראשון</p>
            <p className="font-semibold">{analysis.firstElementSeen}</p>
          </div>
          <div className="p-3 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-surface-muted)] text-center">
            <p className="text-xs text-[var(--color-podium-text-tertiary)]">שני</p>
            <p className="font-semibold">{analysis.secondElementSeen}</p>
          </div>
          <div className="p-3 rounded-[var(--radius-podium-md)] text-center">
            <Badge variant={analysis.hierarchyMatch ? 'success' : 'danger'}>
              {analysis.hierarchyMatch ? 'היררכיה תואמת' : 'היררכיה שגויה'}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-[var(--color-podium-text-secondary)]">{analysis.hierarchyAnalysis}</p>
      </Section>

      <div className="grid md:grid-cols-2 gap-5">
        <Section num={3} title="עומס קוגניטיבי">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">{analysis.cognitiveLoadAnalysis}</p>
        </Section>
        <Section num={4} title="ניתוח רגשי">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">{analysis.emotionalAnalysis}</p>
        </Section>
      </div>

      <Section num={5} title="חיכוך התנהגותי">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--color-podium-text-secondary)]">נטישה משוערת</span>
          <Badge variant="danger">{analysis.estimatedDropOffRate}</Badge>
        </div>
        <ul className="space-y-2 text-sm">
          {analysis.frictionPoints.map((point, i) => (
            <li key={i} className="p-2 rounded-[var(--radius-podium-md)] bg-[var(--color-podium-danger-bg)] text-[var(--color-podium-text)]">
              {point}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid md:grid-cols-2 gap-5">
        <Section num={6} title="אמון וסיכונים">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">{analysis.trustAnalysis}</p>
        </Section>
        <Section num={7} title="היפותזה ו-KPI">
          <div className="flex flex-wrap gap-2 mb-3">
            {analysis.kpiToMeasure.map((kpi, i) => (
              <Badge key={i} variant="info">
                {kpi}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-[var(--color-podium-text-secondary)] italic">{analysis.dropOffHypothesis}</p>
        </Section>
      </div>

      <Section num={8} title="פתרונות">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-podium-border)] text-[var(--color-podium-text-tertiary)]">
                <th className="p-2 font-semibold">רכיב</th>
                <th className="p-2 font-semibold">בעיה</th>
                <th className="p-2 font-semibold">למה</th>
                <th className="p-2 font-semibold">סיכון</th>
                <th className="p-2 font-semibold">פתרון</th>
              </tr>
            </thead>
            <tbody>
              {analysis.solutions.map((item, i) => (
                <tr key={i} className="border-b border-[var(--color-podium-border)]">
                  <td className="p-2 align-top">{item.component}</td>
                  <td className="p-2 align-top text-[var(--color-podium-danger)]">{item.problem}</td>
                  <td className="p-2 align-top text-[var(--color-podium-text-secondary)]">{item.whyItsAProblem}</td>
                  <td className="p-2 align-top">
                    <Badge variant="warning">{item.abandonmentRisk}</Badge>
                  </td>
                  <td className="p-2 align-top text-[var(--color-podium-success)]">{item.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num={9} title="תעדוף">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-[var(--color-podium-success)] mb-2">Quick wins</p>
            <ul className="space-y-1">
              {analysis.prioritization.quickWins.map((item, i) => (
                <li key={i} className="text-[var(--color-podium-text-secondary)]">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--color-podium-warning)] mb-2">Medium impact</p>
            <ul className="space-y-1">
              {analysis.prioritization.mediumImpact.map((item, i) => (
                <li key={i} className="text-[var(--color-podium-text-secondary)]">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-[var(--color-podium-danger)] mb-2">Structural redesign</p>
            <ul className="space-y-1">
              {analysis.prioritization.structuralRedesign.map((item, i) => (
                <li key={i} className="text-[var(--color-podium-text-secondary)]">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}
