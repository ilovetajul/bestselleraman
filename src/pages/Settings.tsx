import React, { useState } from 'react';
import { Moon, Sun, Volume2, SkipForward, Bell, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
      checked ? 'bg-primary-600' : 'bg-black/15 dark:bg-white/20'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

const Row: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="flex items-center justify-between gap-4 py-4">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-primary-600 dark:text-primary-300 shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-ink/50 dark:text-white/50 mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetProgress } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-ink/55 dark:text-white/55 mb-7">
        Tune how the app teaches and reviews with you.
      </p>

      <Card className="px-5 divide-y divide-black/5 dark:divide-white/10">
        <Row
          icon={settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          title="Dark Mode"
          description="Switch between light and dark appearance."
        >
          <Toggle
            checked={settings.theme === 'dark'}
            onChange={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            label="Dark mode"
          />
        </Row>

        <Row
          icon={<Volume2 size={16} />}
          title="Pronunciation"
          description="Show Bangla pronunciation guides on feedback cards."
        >
          <Toggle
            checked={settings.pronunciation}
            onChange={() => updateSettings({ pronunciation: !settings.pronunciation })}
            label="Pronunciation"
          />
        </Row>

        <Row
          icon={<SkipForward size={16} />}
          title="Auto-Next"
          description="Automatically move to the next question after feedback."
        >
          <Toggle
            checked={settings.autoNext}
            onChange={() => updateSettings({ autoNext: !settings.autoNext })}
            label="Auto next"
          />
        </Row>

        <Row
          icon={<Bell size={16} />}
          title="Sound Effects"
          description="Play a short chime for correct and incorrect answers."
        >
          <Toggle
            checked={settings.soundEffects}
            onChange={() => updateSettings({ soundEffects: !settings.soundEffects })}
            label="Sound effects"
          />
        </Row>

        <Row
          icon={<ShieldCheck size={16} />}
          title="Strict Answer Matching"
          description="Require exact wording — turn off to allow small typos."
        >
          <Toggle
            checked={settings.strictMatching}
            onChange={() => updateSettings({ strictMatching: !settings.strictMatching })}
            label="Strict matching"
          />
        </Row>
      </Card>

      <Card className="mt-6 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
            <Trash2 size={16} />
          </div>
          <div>
            <p className="font-medium text-sm">Reset Progress</p>
            <p className="text-xs text-ink/50 dark:text-white/50">
              Clears all mastery data, XP, badges, and settings. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="mt-4 w-full text-sm font-medium text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-xl py-2.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          Reset All Progress
        </button>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset all progress?"
        description="This permanently clears your mastery scores, streak, XP, badges, and settings. This cannot be undone."
        confirmLabel="Reset Progress"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          resetProgress();
          setConfirmOpen(false);
        }}
      />
    </div>
  );
};
