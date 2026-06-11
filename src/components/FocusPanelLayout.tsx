import React, { useState } from 'react';
import { cn } from '../lib/utils';

export type FocusPanelDef = {
  id: string;
  label: string;
  content: React.ReactNode;
  miniPreview?: React.ReactNode;
  hidden?: boolean;
};

type FocusPanelLayoutProps = {
  panels: FocusPanelDef[];
  defaultFocusId?: string;
  focusId?: string;
  onFocusChange?: (id: string) => void;
  footer?: React.ReactNode;
  className?: string;
};

export function FocusPanelLayout({
  panels,
  defaultFocusId,
  focusId: controlledFocusId,
  onFocusChange,
  footer,
  className,
}: FocusPanelLayoutProps) {
  const visible = panels.filter((p) => !p.hidden);
  const [internalFocus, setInternalFocus] = useState(defaultFocusId ?? visible[0]?.id ?? '');
  const [fullscreen, setFullscreen] = useState(false);

  const focusId = controlledFocusId ?? internalFocus;
  const setFocusId = (id: string) => {
    if (!controlledFocusId) setInternalFocus(id);
    onFocusChange?.(id);
  };

  const focused = visible.find((p) => p.id === focusId) ?? visible[0];
  const others = visible.filter((p) => p.id !== focusId);

  if (!focused) return null;

  const miniRail = (
    <div className="flex flex-col gap-2 w-[72px] shrink-0">
      {others.map((panel) => (
        <button
          key={panel.id}
          type="button"
          onClick={() => setFocusId(panel.id)}
          className="group flex flex-col items-center gap-1 rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)] p-1.5 hover:border-[var(--color-podium-primary)] hover:bg-[var(--color-podium-primary-light)] transition-all"
          title={`הצג ${panel.label}`}
        >
          <div className="w-14 h-14 rounded-[var(--radius-podium-sm)] overflow-hidden bg-white border border-[var(--color-podium-border)] flex items-center justify-center text-[10px] font-bold text-[var(--color-podium-text-tertiary)] leading-tight text-center px-0.5">
            {panel.miniPreview ?? panel.label.slice(0, 4)}
          </div>
          <span className="text-[10px] font-semibold text-[var(--color-podium-text-secondary)] group-hover:text-[var(--color-podium-primary)] truncate w-full text-center">
            {panel.label}
          </span>
        </button>
      ))}
    </div>
  );

  const panelHeader = (showFullscreen: boolean) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]/60 shrink-0">
      <span className="text-sm font-semibold text-[var(--color-podium-text)]">{focused.label}</span>
      <div className="flex items-center gap-1">
        {visible.length > 1 && (
          <button
            type="button"
            onClick={() => setFullscreen(showFullscreen ? false : true)}
            className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-podium-sm)] text-[var(--color-podium-text-secondary)] hover:bg-white hover:text-[var(--color-podium-primary)] border border-transparent hover:border-[var(--color-podium-border)] transition-colors"
          >
            {showFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
          </button>
        )}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 bg-[var(--color-podium-bg)] flex flex-col',
          'right-[var(--podium-sidebar-width,16rem)]',
          className
        )}
      >
        {panelHeader(true)}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">{focused.content}</div>
          {footer && (
            <div className="shrink-0 border-t border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]">
              {footer}
            </div>
          )}
        </div>
        {visible.length > 1 && (
          <div className="shrink-0 flex gap-2 p-2 border-t border-[var(--color-podium-border)] bg-white overflow-x-auto">
            {visible.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setFocusId(panel.id)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                  panel.id === focusId
                    ? 'bg-[var(--color-podium-primary)] text-white border-[var(--color-podium-primary)]'
                    : 'bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] border-[var(--color-podium-border)] hover:border-[var(--color-podium-primary)]'
                )}
              >
                {panel.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-1 min-h-0 gap-2', className)}>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 border border-[var(--color-podium-border)] rounded-[var(--radius-podium-lg)] overflow-hidden bg-white">
        {panelHeader(false)}
        <div className="flex-1 min-h-0 overflow-y-auto">{focused.content}</div>
        {footer && (
          <div className="shrink-0 border-t border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]">
            {footer}
          </div>
        )}
      </div>
      {others.length > 0 && miniRail}
    </div>
  );
}
