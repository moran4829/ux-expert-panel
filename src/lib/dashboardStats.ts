import { resolveFindings } from './reportFromDiscussion';
import type { ReviewProject } from '../types';
import type { Expert } from '../types';

export interface DashboardStats {
  completedCount: number;
  completedThisWeek: number;
  completedLastWeek: number;
  criticalFindingsCount: number;
  highOrCriticalProjectsCount: number;
  avgUsability: number | null;
  usabilityTrendDelta: number | null;
  pendingFindingsCount: number;
}

function projectDate(project: ReviewProject): Date {
  return new Date(project.completedAt ?? project.createdAt);
}

function isThisWeek(date: Date, now: Date): boolean {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo && date <= now;
}

function isLastWeek(date: Date, now: Date): boolean {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return date >= twoWeeksAgo && date < weekAgo;
}

export function computeDashboardStats(
  projects: ReviewProject[],
  experts: Expert[] = []
): DashboardStats {
  const now = new Date();
  const completed = projects.filter((p) => p.status === 'completed');

  const completedThisWeek = completed.filter((p) => isThisWeek(projectDate(p), now)).length;
  const completedLastWeek = completed.filter((p) => isLastWeek(projectDate(p), now)).length;

  let criticalFindingsCount = 0;
  let pendingFindingsCount = 0;
  const projectsWithHighSeverity = new Set<string>();

  for (const project of projects) {
    const findings = resolveFindings(
      project,
      project.findings,
      project.messages ?? [],
      project.expertReviews,
      experts,
      project.aggregatedReport,
      project.userChatMessages
    );

    for (const finding of findings) {
      if (finding.severity === 'Critical' || finding.severity === 'High') {
        criticalFindingsCount += 1;
        projectsWithHighSeverity.add(project.id);
      }
      if (finding.status === 'new') {
        pendingFindingsCount += 1;
      }
    }
  }

  const sortedCompleted = [...completed].sort(
    (a, b) => projectDate(b).getTime() - projectDate(a).getTime()
  );

  const usabilityScores = sortedCompleted
    .map((p) => p.scores?.usability)
    .filter((s): s is number => typeof s === 'number' && s > 0);

  const avgUsability =
    usabilityScores.length > 0
      ? Math.round(usabilityScores.reduce((sum, s) => sum + s, 0) / usabilityScores.length)
      : null;

  const recentHalf = sortedCompleted.slice(0, Math.ceil(sortedCompleted.length / 2));
  const olderHalf = sortedCompleted.slice(Math.ceil(sortedCompleted.length / 2));

  const avgRecent =
    recentHalf.length > 0
      ? recentHalf
          .map((p) => p.scores?.usability)
          .filter((s): s is number => typeof s === 'number' && s > 0)
      : [];
  const avgOlder =
    olderHalf.length > 0
      ? olderHalf
          .map((p) => p.scores?.usability)
          .filter((s): s is number => typeof s === 'number' && s > 0)
      : [];

  let usabilityTrendDelta: number | null = null;
  if (avgRecent.length > 0 && avgOlder.length > 0) {
    const recentMean = avgRecent.reduce((a, b) => a + b, 0) / avgRecent.length;
    const olderMean = avgOlder.reduce((a, b) => a + b, 0) / avgOlder.length;
    usabilityTrendDelta = Math.round(recentMean - olderMean);
  }

  return {
    completedCount: completed.length,
    completedThisWeek,
    completedLastWeek,
    criticalFindingsCount,
    highOrCriticalProjectsCount: projectsWithHighSeverity.size,
    avgUsability,
    usabilityTrendDelta,
    pendingFindingsCount,
  };
}

export function sortProjectsByRecency(projects: ReviewProject[]): ReviewProject[] {
  return [...projects].sort(
    (a, b) => projectDate(b).getTime() - projectDate(a).getTime()
  );
}
