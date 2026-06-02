import type { ReviewProject } from '../types';

/** תאריך להצגה: תאריך סיום לבדיקה שהושלמה, אחרת תאריך יצירה */
export function getProjectDisplayIso(project: Pick<ReviewProject, 'createdAt' | 'completedAt' | 'status'>): string {
  if (project.status === 'completed' && project.completedAt) {
    return project.completedAt;
  }
  return project.createdAt;
}

export function formatDateHe(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatProjectDate(project: Pick<ReviewProject, 'createdAt' | 'completedAt' | 'status'>): string {
  return formatDateHe(getProjectDisplayIso(project));
}

export function formatProjectCompletedLabel(
  project: Pick<ReviewProject, 'createdAt' | 'completedAt' | 'status'>
): string {
  if (project.status !== 'completed') {
    return formatDateHe(project.createdAt);
  }
  return `הושלם ב-${formatProjectDate(project)}`;
}
