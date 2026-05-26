import React from 'react';
import { cn } from '../../lib/utils';

export type CardProps = React.ComponentPropsWithoutRef<'div'> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-podium-surface)] border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] shadow-[var(--shadow-podium-sm)]',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-[var(--color-podium-border)] flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
