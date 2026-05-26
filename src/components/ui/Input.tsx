import React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  icon?: React.ReactNode;
};

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-podium-text-tertiary)] pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={cn(
          'w-full bg-white border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] py-2.5 px-4 text-sm text-[var(--color-podium-text)] placeholder:text-[var(--color-podium-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-podium-primary)]/20 focus:border-[var(--color-podium-primary)] transition-all',
          icon && 'pr-10',
          className
        )}
        {...props}
      />
    </div>
  );
}

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full bg-white border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] py-3 px-4 text-sm text-[var(--color-podium-text)] placeholder:text-[var(--color-podium-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-podium-primary)]/20 focus:border-[var(--color-podium-primary)] transition-all resize-none',
        className
      )}
      {...props}
    />
  );
}

export type SelectProps = React.ComponentPropsWithoutRef<'select'>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full bg-white border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] py-2.5 px-4 text-sm text-[var(--color-podium-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-podium-primary)]/20 focus:border-[var(--color-podium-primary)] transition-all appearance-none',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
