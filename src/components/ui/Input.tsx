import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeftIcon } from '../icons';

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

type SelectOption = { value: string; label: string };

function parseSelectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ value?: string; children?: React.ReactNode }>(child)) return;
    if (child.type !== 'option') return;
    const value =
      child.props.value !== undefined ? String(child.props.value) : String(child.props.children ?? '');
    const label =
      typeof child.props.children === 'string'
        ? child.props.children
        : value;
    options.push({ value, label });
  });
  return options;
}

export type SelectProps = {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  children: React.ReactNode;
};

export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  id: idProp,
  name,
}: SelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const options = useMemo(() => parseSelectOptions(children), [children]);
  const selected =
    options.find((o) => o.value === String(value ?? '')) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const emitChange = (nextValue: string) => {
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {name ? <input type="hidden" name={name} value={selected?.value ?? ''} readOnly /> : null}
      <button
        type="button"
        id={idProp}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'relative w-full text-start bg-white border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-podium-text)] shadow-[var(--shadow-podium-sm)] transition-all',
          'hover:border-[var(--color-podium-border-strong)] hover:shadow-[var(--shadow-podium-md)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-podium-primary)]/20 focus:border-[var(--color-podium-primary)]',
          open && 'ring-2 ring-[var(--color-podium-primary)]/20 border-[var(--color-podium-primary)] shadow-[var(--shadow-podium-md)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="block truncate">{selected?.label ?? '—'}</span>
        <span
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-podium-text-tertiary)] pointer-events-none transition-transform duration-200',
            open && 'rotate-90 text-[var(--color-podium-primary)]'
          )}
          aria-hidden
        >
          <ChevronLeftIcon size={16} />
        </span>
      </button>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-[var(--radius-podium-lg)] border border-[var(--color-podium-border)] bg-white py-1 shadow-[var(--shadow-podium-md)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === selected?.value;
            return (
              <li key={opt.value || `opt-${opt.label}`} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    emitChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-start px-4 py-2.5 text-sm transition-colors',
                    isSelected
                      ? 'bg-[var(--color-podium-primary-light)] text-[var(--color-podium-primary)] font-semibold'
                      : 'text-[var(--color-podium-text)] hover:bg-[var(--color-podium-surface-muted)]'
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
