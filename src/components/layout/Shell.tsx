import React from 'react';
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  RotateCcw,
  Zap,
  Trophy,
  Medal,
  TrendingUp,
  Settings as SettingsIcon,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import type { Page } from '../../types';
import { useApp } from '../../context/AppContext';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'home', label: 'Home', icon: <Home size={19} /> },
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
  { page: 'practice', label: 'Practice', icon: <GraduationCap size={19} /> },
  { page: 'review', label: 'Review', icon: <RotateCcw size={19} /> },
  { page: 'challenge', label: '120s Challenge', icon: <Zap size={19} /> },
  { page: 'fulltest', label: 'Full Test', icon: <Medal size={19} /> },
  { page: 'competition', label: '🏆 Competition', icon: <Trophy size={19} /> },
  { page: 'progress', label: 'Progress', icon: <TrendingUp size={19} /> },
  { page: 'settings', label: 'Settings', icon: <SettingsIcon size={19} /> },
];

// Mobile bottom nav shows a curated subset to avoid crowding small screens.
const MOBILE_NAV_PAGES: Page[] = ['home', 'practice', 'competition', 'review', 'progress'];

interface ShellProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ currentPage, onNavigate, children }) => {
  const { progress, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink-dark">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-black/5 dark:border-white/10 px-4 py-6 shrink-0">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-display font-semibold shadow-soft">
            B
          </div>
          <div>
            <p className="font-display font-semibold leading-tight text-primary-600 dark:text-primary-300 tracking-wide">
              BESTSELLER
            </p>
            <p className="text-xs text-ink/50 dark:text-white/50 leading-tight">Principles Master</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentPage === item.page
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'text-ink/65 hover:bg-black/5 dark:text-white/65 dark:hover:bg-white/10'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
            <Flame size={16} />
            {progress.streakDays}
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink/60 dark:text-white/60"
          >
            {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-black/5 dark:border-white/10 sticky top-0 bg-paper/90 dark:bg-ink-dark/90 backdrop-blur z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-display font-semibold">
              B
            </div>
            <span className="font-display font-semibold text-sm">
              <span className="text-primary-600 dark:text-primary-300">BESTSELLER</span> Master
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <Flame size={14} />
              {progress.streakDays}
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink/60 dark:text-white/60"
            >
              {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur border-t border-black/5 dark:border-white/10 flex justify-around px-1 py-2 [padding-bottom:env(safe-area-inset-bottom)]">
          {NAV_ITEMS.filter((item) => MOBILE_NAV_PAGES.includes(item.page)).map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
                currentPage === item.page
                  ? 'text-primary-600 dark:text-primary-300'
                  : 'text-ink/45 dark:text-white/45'
              }`}
              aria-current={currentPage === item.page ? 'page' : undefined}
            >
              {item.icon}
              {item.label.replace(' Challenge', '').replace('🏆 ', '')}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
