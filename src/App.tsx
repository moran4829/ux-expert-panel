import React from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Wizard } from './pages/NewTest/Wizard';
import { DiscussionRoom } from './pages/Discussion/DiscussionRoom';
import { ReportView } from './pages/Report/ReportView';
import { Settings } from './pages/Settings/Settings';
import { ReportsArchive } from './pages/ReportsArchive';

function AppContent() {
  const { activeRoute } = useAppContext();

  switch (activeRoute) {
    case 'dashboard':
      return <Dashboard />;
    case 'new-test':
      return <Wizard />;
    case 'discussion':
      return <DiscussionRoom />;
    case 'report':
      return <ReportView />;
    case 'reports':
      return <ReportsArchive />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </AppProvider>
  );
}
