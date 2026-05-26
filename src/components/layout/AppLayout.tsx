import React from 'react';
import { useAppContext } from '../../AppContext';
import {
  DashboardIcon,
  PlusCircleIcon,
  HistoryIcon,
  SettingsIcon,
  UserIcon,
  ChevronLeftIcon,
} from '../icons';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo2.svg';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeRoute, navigate } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'לוח בקרה', icon: DashboardIcon },
    { id: 'new-test', label: 'בדיקה חדשה', icon: PlusCircleIcon },
    { id: 'reports', label: 'ארכיון בדיקות', icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen flex w-full bg-[var(--color-podium-bg)] relative rtl">
      <aside className="w-64 bg-[var(--color-podium-sidebar)] flex flex-col fixed inset-y-0 right-0 z-10 border-l border-[var(--color-podium-sidebar-border)]">
        <div className="p-6 pb-4">
          <img src={logo} alt="Podium by CodeOasis" className="h-8 w-auto max-w-full" />
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-podium-md)] text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-[var(--color-podium-sidebar-active)] text-white'
                    : 'text-white/60 hover:bg-[var(--color-podium-sidebar-hover)] hover:text-white/90'
                )}
              >
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
                )}
                <item.icon
                  className={cn(isActive ? 'text-[var(--color-podium-primary)]' : 'text-white/40')}
                  size={18}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--color-podium-sidebar-border)]">
          <button
            onClick={() => navigate('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-podium-md)] text-sm font-medium transition-all duration-200 relative',
              activeRoute === 'settings'
                ? 'bg-[var(--color-podium-sidebar-active)] text-white'
                : 'text-white/60 hover:bg-[var(--color-podium-sidebar-hover)] hover:text-white/90'
            )}
          >
            {activeRoute === 'settings' && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
            )}
            <SettingsIcon
              className={cn(activeRoute === 'settings' ? 'text-[var(--color-podium-primary)]' : 'text-white/40')}
              size={18}
            />
            הגדרות מערכת
          </button>
          <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-sidebar-hover)] border border-[var(--color-podium-sidebar-border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center shrink-0">
              <UserIcon className="text-white" size={16} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-white truncate">צוות מוצר</span>
              <span className="text-xs text-white/40 truncate w-full text-right">product@acme.com</span>
            </div>
          </div>
        </div>

        <button
          className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[var(--color-podium-primary)] text-white flex items-center justify-center shadow-[var(--shadow-podium-md)] hover:bg-[var(--color-podium-primary-hover)] transition-colors"
          aria-label="כיווץ תפריט"
        >
          <ChevronLeftIcon size={14} />
        </button>
      </aside>

      <main className="flex-1 pr-64 min-h-screen relative">
        <div className="p-8 max-w-6xl mx-auto h-full min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
