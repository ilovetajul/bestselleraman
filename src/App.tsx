import React, { useState } from 'react';
import type { Page } from './types';
import { Shell } from './components/layout/Shell';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Practice } from './pages/Practice';
import { Review } from './pages/Review';
import { Challenge30s } from './pages/Challenge30s';
import { FullTest } from './pages/FullTest';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/Settings';
import { Competition } from './features/competition/Competition';

export default function App() {
  const [page, setPage] = useState<Page>('home');

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home onNavigate={setPage} />;
      case 'dashboard':
        return <Dashboard />;
      case 'practice':
        return <Practice onNavigate={setPage} />;
      case 'review':
        return <Review onNavigate={setPage} />;
      case 'challenge':
        return <Challenge30s onNavigate={setPage} />;
      case 'fulltest':
        return <FullTest onNavigate={setPage} />;
      case 'competition':
        return <Competition />;
      case 'progress':
        return <ProgressPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Home onNavigate={setPage} />;
    }
  };

  return (
    <Shell currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Shell>
  );
}
