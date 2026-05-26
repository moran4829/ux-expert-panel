import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] border-[var(--color-podium-border)]',
  primary: 'bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)] border-[var(--color-podium-primary-muted)]',
  success: 'bg-[var(--color-podium-success-bg)] text-[var(--color-podium-success)] border-green-100',
  warning: 'bg-[var(--color-podium-warning-bg)] text-[var(--color-podium-warning)] border-amber-100',
  danger: 'bg-[var(--color-podium-danger-bg)] text-[var(--color-podium-danger)] border-red-100',
  info: 'bg-[var(--color-podium-info-bg)] text-[var(--color-podium-info)] border-blue-100',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
