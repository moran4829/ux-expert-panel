import React from 'react';
import { cn } from '../../lib/utils';

type Status = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
}

const dotColors: Record<Status, string> = {
  success: 'bg-[var(--color-podium-success)]',
  warning: 'bg-[var(--color-podium-warning)]',
  danger: 'bg-[var(--color-podium-danger)]',
  neutral: 'bg-[var(--color-podium-text-tertiary)]',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm font-medium text-[var(--color-podium-text)]', className)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', dotColors[status])} />
      {label}
    </span>
  );
}
