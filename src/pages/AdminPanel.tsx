import React, { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../AppContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getUserProjectCounts, listAllUsers, resolveUserPhoto, type UserProfile } from '../lib/userDataFirestore';
import { getReviewKind } from '../lib/projectKind';

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const { navigate, setViewAsUserId, viewAsUserId, adminAllProjects, refreshAdminData } = useAppContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userList, projectCounts] = await Promise.all([listAllUsers(), getUserProjectCounts()]);
      setUsers(userList.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')));
      setCounts(projectCounts);
      await refreshAdminData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'טעינת נתוני admin נכשלה');
    } finally {
      setLoading(false);
    }
  }, [refreshAdminData]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-podium-text-secondary)]">אין הרשאת admin.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('dashboard')}>
          חזרה לדשבורד
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-podium-text)] flex items-center gap-2">
            ניהול מערכת
            <Badge variant="warning">Admin</Badge>
          </h1>
          <p className="text-sm text-[var(--color-podium-text-secondary)] mt-1">
            צפייה בכל המשתמשים והבדיקות. לחצו &quot;צפייה כמשתמש&quot; כדי לראות את הנתונים שלו.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
          רענון
        </Button>
      </div>

      {viewAsUserId && (
        <Card className="border-[var(--color-podium-primary-muted)] bg-[var(--color-podium-primary-light)]/40">
          <p className="text-sm text-[var(--color-podium-text)]">
            מצב צפייה פעיל — UID: <code className="text-xs">{viewAsUserId}</code>
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setViewAsUserId(null);
              navigate('admin');
            }}
          >
            יציאה ממצב צפייה
          </Button>
        </Card>
      )}

      {error && (
        <Card className="border-[var(--color-podium-danger)] bg-[var(--color-podium-danger-bg)]">
          <p className="text-sm text-[var(--color-podium-danger)]">{error}</p>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-[var(--color-podium-border)]">
          <h2 className="font-semibold text-[var(--color-podium-text)]">משתמשים ({users.length})</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-[var(--color-podium-text-secondary)]">טוען...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-podium-text-secondary)]">אין משתמשים עדיין.</p>
        ) : (
          <div className="divide-y divide-[var(--color-podium-border)]">
            {users.map((u) => (
              <div key={u.uid} className="flex items-center gap-4 p-4 flex-wrap">
                {resolveUserPhoto(u) ? (
                  <img src={resolveUserPhoto(u)!} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--color-podium-border)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-podium-primary-light)] flex items-center justify-center text-sm font-bold text-[var(--color-podium-primary)]">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-podium-text)] truncate">{u.displayName ?? 'ללא שם'}</p>
                  <p className="text-xs text-[var(--color-podium-text-secondary)] truncate">{u.email ?? u.uid}</p>
                </div>
                <Badge>{counts.get(u.uid) ?? 0} בדיקות</Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setViewAsUserId(u.uid);
                    navigate('dashboard');
                  }}
                >
                  צפייה כמשתמש
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="none">
        <div className="p-4 border-b border-[var(--color-podium-border)]">
          <h2 className="font-semibold text-[var(--color-podium-text)]">כל הבדיקות ({adminAllProjects.length})</h2>
        </div>
        {adminAllProjects.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-podium-text-secondary)]">אין בדיקות.</p>
        ) : (
          <div className="divide-y divide-[var(--color-podium-border)] max-h-96 overflow-y-auto">
            {adminAllProjects.map((p) => (
              <div key={`${p.ownerUid}-${p.id}`} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-podium-text)] truncate">{p.name}</p>
                  <p className="text-xs text-[var(--color-podium-text-secondary)]">
                    {p.ownerName ?? p.ownerEmail ?? p.ownerUid} ·{' '}
                    {getReviewKind(p) === 'user' ? 'בדיקת משתמשים' : 'בדיקת מומחים'} · {p.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setViewAsUserId(p.ownerUid);
                    navigate('dashboard');
                  }}
                >
                  פתיחה
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
