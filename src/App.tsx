import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Wizard } from './pages/NewTest/Wizard';
import { UserTestWizard } from './pages/UserTest/UserTestWizard';
import { UserSimulationView } from './pages/UserTest/UserSimulationView';
import { PersonaLibrary } from './pages/UserTest/PersonaLibrary';
import { DiscussionRoom } from './pages/Discussion/DiscussionRoom';
import { ReportView } from './pages/Report/ReportView';
import { Settings } from './pages/Settings/Settings';
import { ReportsArchive } from './pages/ReportsArchive';
import { UserLlmSetupPage } from './pages/UserLlmSetup';
import { isUserLlmConfigured } from './lib/userLlm';
import { AdminPanel } from './pages/AdminPanel';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';

function DataStatusBanners() {
  const {
    dataLoading,
    dataSyncError,
    pendingLocalMigration,
    importLocalDataToCloud,
    isViewingAsOtherUser,
    setViewAsUserId,
    navigate,
  } = useAppContext();
  const [importing, setImporting] = React.useState(false);

  if (dataLoading) {
    return (
      <Card className="mb-4 border-[var(--color-podium-border)]">
        <p className="text-sm text-[var(--color-podium-text-secondary)]">טוען את הנתונים שלך מהענן...</p>
      </Card>
    );
  }

  return (
    <>
      {isViewingAsOtherUser && (
        <Card className="mb-4 border-amber-200 bg-[var(--color-podium-warning-bg)]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-amber-900 font-medium">מצב צפייה (Admin) — read-only</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setViewAsUserId(null);
                navigate('admin');
              }}
            >
              יציאה ממצב צפייה
            </Button>
          </div>
        </Card>
      )}

      {dataSyncError && (
        <Card className="mb-4 border-[var(--color-podium-danger)] bg-[var(--color-podium-danger-bg)]">
          <p className="text-sm text-[var(--color-podium-danger)]">{dataSyncError}</p>
        </Card>
      )}

      {pendingLocalMigration && !isViewingAsOtherUser && (
        <Card className="mb-4 border-[var(--color-podium-primary-muted)] bg-[var(--color-podium-primary-light)]/40">
          <p className="text-sm text-[var(--color-podium-text)] mb-3">
            נמצאו נתונים במחשב שלא הועלו לענן. לייבא?
          </p>
          <Button
            size="sm"
            disabled={importing}
            onClick={async () => {
              setImporting(true);
              try {
                await importLocalDataToCloud();
              } finally {
                setImporting(false);
              }
            }}
          >
            {importing ? 'מייבא...' : 'ייבוא לענן'}
          </Button>
        </Card>
      )}
    </>
  );
}

function AppContent() {
  const { activeRoute } = useAppContext();

  const page = (() => {
    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'expert-test':
      case 'new-test':
        return <Wizard />;
      case 'user-test':
        return <UserTestWizard />;
      case 'user-simulation':
        return <UserSimulationView />;
      case 'persona-library':
        return <PersonaLibrary />;
      case 'discussion':
        return <DiscussionRoom />;
      case 'report':
        return <ReportView />;
      case 'reports':
        return <ReportsArchive />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  })();

  return (
    <>
      <DataStatusBanners />
      {page}
    </>
  );
}

function AuthenticatedAppBody() {
  const { isAdmin } = useAuth();
  const { dataLoading, llmSettings } = useAppContext();

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-podium-bg)] rtl">
        <Card className="text-center p-8">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">טוען את הנתונים שלך מהענן...</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin && !isUserLlmConfigured(llmSettings)) {
    return <UserLlmSetupPage />;
  }

  return (
    <AppLayout>
      <AppContent />
    </AppLayout>
  );
}

function AuthenticatedShell() {
  const { user, loading, completingEmailLink } = useAuth();

  if (loading || completingEmailLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-podium-bg)] rtl">
        <Card className="text-center p-8">
          <p className="text-sm text-[var(--color-podium-text-secondary)]">
            {completingEmailLink ? 'משלימה התחברות מהמייל...' : 'טוען...'}
          </p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <AuthenticatedAppBody />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedShell />
    </AuthProvider>
  );
}
