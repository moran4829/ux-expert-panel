import { ReviewKind, ReviewProject } from '../types';

export function getReviewKind(project: ReviewProject): ReviewKind {
  return project.reviewKind ?? 'expert';
}

export function isExpertReview(project: ReviewProject): boolean {
  return getReviewKind(project) === 'expert';
}

export function isUserReview(project: ReviewProject): boolean {
  return getReviewKind(project) === 'user';
}

export function showUserSimulationInReport(project: ReviewProject): boolean {
  return isUserReview(project) || project.userTestingEnabled === true;
}
