import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import {
  DashboardIcon,
  PlusCircleIcon,
  HistoryIcon,
  SettingsIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../icons';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo2.svg';
import logoFav from '../../assets/logo_fav.svg';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeRoute, navigate } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'עמוד בית', icon: DashboardIcon },
    { id: 'expert-test', label: 'בדיקת מומחים', icon: PlusCircleIcon },
    { id: 'user-test', label: 'בדיקת משתמשים', icon: UserIcon },
    { id: 'reports', label: 'ארכיון בדיקות', icon: HistoryIcon },
  ];

  const isNavActive = (routeId: string) =>
    activeRoute === routeId ||
    (routeId === 'expert-test' && (activeRoute === 'discussion' || activeRoute === 'report' || activeRoute === 'new-test')) ||
    (routeId === 'user-test' && activeRoute === 'user-simulation');

  const navButtonClass = (isActive: boolean) =>
    cn(
      'w-full flex items-center rounded-[var(--radius-podium-md)] text-sm font-medium transition-all duration-200 relative',
      sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      isActive
        ? 'bg-[var(--color-podium-sidebar-active)] text-white'
        : 'text-white/60 hover:bg-[var(--color-podium-sidebar-hover)] hover:text-white/90'
    );

  return (
    <div className="min-h-screen flex w-full bg-[var(--color-podium-bg)] relative rtl">
      <aside
        className={cn(
          'bg-[var(--color-podium-sidebar)] flex flex-col fixed inset-y-0 right-0 z-20 border-l border-[var(--color-podium-sidebar-border)] transition-[width] duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('pb-4', sidebarCollapsed ? 'p-3 flex justify-center' : 'p-6 pb-4')}>
          <img
            src={sidebarCollapsed ? logoFav : logo}
            alt="Podium by CodeOasis"
            className={cn(
              'object-contain',
              sidebarCollapsed ? 'h-8 w-8' : 'h-8 w-auto max-w-full'
            )}
          />
        </div>

        <nav className={cn('flex-1 space-y-1 mt-2', sidebarCollapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => {
            const isActive = isNavActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={navButtonClass(isActive)}
              >
                {isActive && !sidebarCollapsed && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
                )}
                <item.icon
                  className={cn('shrink-0', isActive ? 'text-[var(--color-podium-primary)]' : 'text-white/40')}
                  size={18}
                />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--color-podium-sidebar-border)]">
          <button
            type="button"
            onClick={() => navigate('settings')}
            title={sidebarCollapsed ? 'הגדרות מערכת' : undefined}
            className={navButtonClass(activeRoute === 'settings')}
          >
            {activeRoute === 'settings' && !sidebarCollapsed && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
            )}
            <SettingsIcon
              className={cn(
                'shrink-0',
                activeRoute === 'settings' ? 'text-[var(--color-podium-primary)]' : 'text-white/40'
              )}
              size={18}
            />
            {!sidebarCollapsed && <span className="truncate">הגדרות מערכת</span>}
          </button>

          {sidebarCollapsed ? (
            <div className="mt-3 flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center shrink-0"
                title="צוות מוצר"
              >
                <UserIcon className="text-white" size={16} />
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 px-3 py-3 rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-sidebar-hover)] border border-[var(--color-podium-sidebar-border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center shrink-0">
                <UserIcon className="text-white" size={16} />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold text-white truncate">צוות מוצר</span>
                <span className="text-xs text-white/40 truncate w-full text-right">product@acme.com</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setSidebarCollapsed((c) => !c)}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 w-6 h-6 rounded-full bg-[var(--color-podium-primary)] text-white flex items-center justify-center shadow-[var(--shadow-podium-md)] hover:bg-[var(--color-podium-primary-hover)] transition-[right] duration-300 ease-in-out',
          sidebarCollapsed ? 'right-[calc(4rem-0.75rem)]' : 'right-[calc(16rem-0.75rem)]'
        )}
        aria-label={sidebarCollapsed ? 'הרחבת תפריט' : 'כיווץ תפריט'}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? (
          <ChevronLeftIcon size={14} />
        ) : (
          <ChevronRightIcon size={14} />
        )}
      </button>

      <main
        className={cn(
          'relative z-0 flex-1 min-h-screen transition-[padding] duration-300 ease-in-out',
          sidebarCollapsed ? 'pr-16' : 'pr-64'
        )}
      >
        <div className="p-8 max-w-6xl mx-auto h-full min-h-screen flex flex-col">{children}</div>
      </main>
    </div>
  );
}
