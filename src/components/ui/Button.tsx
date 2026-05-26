import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-podium-primary)] text-white hover:bg-[var(--color-podium-primary-hover)] shadow-[var(--shadow-podium-sm)]',
  secondary:
    'bg-white text-[var(--color-podium-text)] border border-[var(--color-podium-border)] hover:bg-[var(--color-podium-surface-muted)]',
  ghost:
    'bg-transparent text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-surface-muted)] hover:text-[var(--color-podium-text)]',
  danger:
    'bg-[var(--color-podium-danger)] text-white hover:bg-red-700',
  success:
    'bg-[var(--color-podium-success)] text-white hover:bg-green-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-podium-md)]',
  md: 'px-4 py-2.5 text-sm rounded-[var(--radius-podium-md)]',
  lg: 'px-5 py-3 text-sm rounded-[var(--radius-podium-lg)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
