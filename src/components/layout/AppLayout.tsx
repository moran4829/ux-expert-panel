import React, { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../UserProfileModal';
import {
  DashboardIcon,
  PlusCircleIcon,
  HistoryIcon,
  SettingsIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditProfileIcon,
  LogoutIcon,
} from '../icons';
import { cn } from '../../lib/utils';
import { APP_NAME } from '../../lib/appBrand';
import logo from '../../assets/logo2.svg';
import logoFav from '../../assets/logo_fav.svg';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeRoute, navigate } = useAppContext();
  const { user, isAdmin, profileVersion, userPhoto, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userTestOpen, setUserTestOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'עמוד בית', icon: DashboardIcon },
    { id: 'expert-test', label: 'בדיקת מומחים', icon: PlusCircleIcon },
    { id: 'reports', label: 'ארכיון בדיקות', icon: HistoryIcon },
  ];

  const userTestSubItems = [
    { id: 'user-test', label: 'בדיקה חדשה' },
    { id: 'persona-library', label: 'מאגר פרסונות' },
  ];

  const isUserTestRoute = ['user-test', 'user-simulation', 'persona-library'].includes(activeRoute);

  const isNavActive = (routeId: string) =>
    activeRoute === routeId ||
    (routeId === 'expert-test' && (activeRoute === 'discussion' || activeRoute === 'report' || activeRoute === 'new-test'));

  const navButtonClass = (isActive: boolean) =>
    cn(
      'w-full flex items-center rounded-[var(--radius-podium-md)] text-sm font-medium transition-all duration-200 relative',
      sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      isActive
        ? 'bg-[var(--color-podium-sidebar-active)] text-white'
        : 'text-white/60 hover:bg-[var(--color-podium-sidebar-hover)] hover:text-white/90'
    );

  const userInitial =
    user?.displayName?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?';

  const profileKey = `${user?.uid ?? 'anon'}-${profileVersion}`;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="min-h-screen flex w-full bg-[var(--color-podium-bg)] relative rtl"
      style={{ '--podium-sidebar-width': sidebarCollapsed ? '4rem' : '16rem' } as React.CSSProperties}
    >
      <aside
        className={cn(
          'bg-[var(--color-podium-sidebar)] flex flex-col fixed inset-y-0 right-0 z-20 border-l border-[var(--color-podium-sidebar-border)] transition-[width] duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('pb-4', sidebarCollapsed ? 'p-3 flex justify-center' : 'p-6 pb-4')}>
          <img
            src={sidebarCollapsed ? logoFav : logo}
            alt={APP_NAME}
            className={cn('object-contain', sidebarCollapsed ? 'h-8 w-8' : 'h-8 w-auto max-w-full')}
          />
        </div>

        <nav className={cn('flex-1 space-y-1 mt-2', sidebarCollapsed ? 'px-2' : 'px-3')}>
          {navItems.slice(0, 2).map((item) => {
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

          {/* User test group */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (sidebarCollapsed) {
                  navigate('user-test');
                } else {
                  setUserTestOpen((o) => !o);
                }
              }}
              title={sidebarCollapsed ? 'בדיקת משתמשים' : undefined}
              className={navButtonClass(isUserTestRoute)}
            >
              {isUserTestRoute && !sidebarCollapsed && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
              )}
              <UserIcon
                className={cn('shrink-0', isUserTestRoute ? 'text-[var(--color-podium-primary)]' : 'text-white/40')}
                size={18}
              />
              {!sidebarCollapsed && (
                <>
                  <span className="truncate flex-1 text-right">בדיקת משתמשים</span>
                  <ChevronLeftIcon
                    size={14}
                    className={cn('shrink-0 transition-transform -rotate-90', userTestOpen && 'rotate-90')}
                  />
                </>
              )}
            </button>
            {!sidebarCollapsed && userTestOpen && (
              <div className="mr-4 mt-1 space-y-0.5 border-r border-white/10 pr-2">
                {userTestSubItems.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => navigate(sub.id)}
                    className={cn(
                      'w-full text-right px-3 py-2 rounded-[var(--radius-podium-md)] text-xs font-medium transition-colors',
                      activeRoute === sub.id
                        ? 'bg-[var(--color-podium-sidebar-active)] text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-[var(--color-podium-sidebar-hover)]'
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {navItems.slice(2).map((item) => {
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

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('admin')}
              title={sidebarCollapsed ? 'ניהול מערכת' : undefined}
              className={navButtonClass(activeRoute === 'admin')}
            >
              {activeRoute === 'admin' && !sidebarCollapsed && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--color-podium-primary)] rounded-l-full" />
              )}
              <SettingsIcon
                className={cn(
                  'shrink-0',
                  activeRoute === 'admin' ? 'text-[var(--color-podium-warning)]' : 'text-white/40'
                )}
                size={18}
              />
              {!sidebarCollapsed && <span className="truncate">ניהול מערכת</span>}
            </button>
          )}
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
            <div className="mt-3 flex flex-col items-center gap-2">
              {userPhoto ? (
                <img
                  key={profileKey}
                  src={userPhoto}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-podium-primary)]"
                  title={user?.displayName ?? user?.email ?? undefined}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  title={user?.displayName ?? user?.email ?? 'משתמש'}
                >
                  {userInitial}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="p-1.5 rounded-[var(--radius-podium-md)] text-white/50 hover:text-white hover:bg-[var(--color-podium-sidebar-hover)] transition-colors"
                  title="עריכת פרופיל"
                  aria-label="עריכת פרופיל"
                >
                  <EditProfileIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="p-1.5 rounded-[var(--radius-podium-md)] text-white/50 hover:text-white hover:bg-[var(--color-podium-sidebar-hover)] transition-colors disabled:opacity-50"
                  title="התנתקות"
                  aria-label="התנתקות"
                >
                  <LogoutIcon size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 w-full rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-sidebar-hover)] border border-[var(--color-podium-sidebar-border)] overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-3">
                {userPhoto ? (
                  <img
                    key={profileKey}
                    src={userPhoto}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center shrink-0 text-sm font-bold text-white">
                    {userInitial}
                  </div>
                )}
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white truncate w-full">
                    {user?.displayName ?? 'משתמש'}
                  </span>
                  <span className="text-xs text-white/40 truncate w-full text-right">{user?.email ?? ''}</span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-[var(--color-podium-warning)] mt-0.5">Admin</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 py-2 border-t border-[var(--color-podium-sidebar-border)]">
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="p-1.5 rounded-[var(--radius-podium-md)] text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  title="עריכת פרופיל"
                  aria-label="עריכת פרופיל"
                >
                  <EditProfileIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="p-1.5 rounded-[var(--radius-podium-md)] text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  title="התנתקות"
                  aria-label="התנתקות"
                >
                  <LogoutIcon size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

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
        {sidebarCollapsed ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
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
