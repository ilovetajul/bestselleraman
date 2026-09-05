import React, { useEffect, useState } from 'react';
import { Plus, Clock, ShieldCheck, LogOut, Keyboard, Mic } from 'lucide-react';
import { supabase, callFunction } from '../../lib/supabase';
import { useAdminAuth } from './hooks/useAdminAuth';
import type { AdminContestRow, AnswerMode, ContestStatus } from '../../types/competition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

function dhakaDateTimeToISO(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  const iso = new Date(`${dateStr}T${timeStr}:00+06:00`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

function formatDhaka(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const STATUS_TONE: Record<ContestStatus, 'neutral' | 'amber' | 'primary' | 'rose'> = {
  draft: 'neutral',
  scheduled: 'amber',
  live: 'primary',
  finished: 'rose',
};

interface AdminDashboardProps {
  onOpenContest: (contestId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenContest }) => {
  const { signOut } = useAdminAuth();
  const [contests, setContests] = useState<AdminContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState('BESTSELLER 10 Founding Principles Competition');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [requireContact, setRequireContact] = useState(false);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('keyboard');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadContests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contests')
      .select('id, name, timezone, start_at, end_at, duration_seconds, status, results_published, answer_mode, created_at')
      .order('created_at', { ascending: false });
    setContests((data ?? []) as AdminContestRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleCreate = async (initialStatus: 'draft' | 'scheduled') => {
    setCreateError(null);
    const startAt = dhakaDateTimeToISO(startDate, startTime);
    const endAt = dhakaDateTimeToISO(endDate, endTime);

    if (!name.trim()) return setCreateError('Competition name is required.');
    if (!startAt) return setCreateError('A valid start date and time is required.');
    if (!endAt) return setCreateError('A valid end date and time is required.');

    setCreating(true);
    try {
      await callFunction(
        'admin-create-contest',
        {
          name: name.trim(),
          startAt,
          endAt,
          durationSeconds: Math.round(durationMinutes * 60),
          timezone: 'Asia/Dhaka',
          requireContact,
          initialStatus,
          answerMode,
        },
        { authed: true }
      );
      setShowCreate(false);
      await loadContests();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create contest.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink-dark">
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <ShieldCheck size={16} />
          </div>
          <span className="font-display font-semibold">BESTSELLER Admin</span>
        </div>
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={signOut}>
          Sign Out
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">Competitions</h1>
            <p className="text-sm text-ink/55 dark:text-white/55 mt-1">
              All times shown in <span className="font-medium">Bangladesh Time (UTC+6)</span>.
            </p>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate((s) => !s)}>
            New Competition
          </Button>
        </div>

        {showCreate && (
          <Card className="p-6 mb-6">
            <h2 className="font-display font-semibold mb-4">Create Competition</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                  Competition Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                    Start Date (Asia/Dhaka)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                    Start Time (Asia/Dhaka)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                    End Date (Asia/Dhaka)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                    End Time (Asia/Dhaka)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                  Duration (minutes) — used for the in-competition countdown
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                  Answer Input Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAnswerMode('keyboard')}
                    className={`flex items-start gap-2.5 text-left px-3.5 py-3 rounded-xl border transition-colors ${
                      answerMode === 'keyboard'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                        : 'border-black/15 dark:border-white/20'
                    }`}
                  >
                    <Keyboard size={16} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium">Keyboard Typing</span>
                      <span className="block text-xs text-ink/50 dark:text-white/50">
                        With anti-copy/paste protection
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerMode('voice')}
                    className={`flex items-start gap-2.5 text-left px-3.5 py-3 rounded-xl border transition-colors ${
                      answerMode === 'voice'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                        : 'border-black/15 dark:border-white/20'
                    }`}
                  >
                    <Mic size={16} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium">Voice Only</span>
                      <span className="block text-xs text-ink/50 dark:text-white/50">
                        No typing at all — Chrome only
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requireContact}
                  onChange={(e) => setRequireContact(e.target.checked)}
                />
                Require phone or email at registration
              </label>

              {createError && <p className="text-sm text-rose-600 dark:text-rose-300">{createError}</p>}

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button variant="secondary" disabled={creating} onClick={() => handleCreate('draft')}>
                  Save Draft
                </Button>
                <Button disabled={creating} onClick={() => handleCreate('scheduled')}>
                  Schedule Competition
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-ink/50 dark:text-white/50">Loading…</p>
        ) : contests.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink/50 dark:text-white/50">
            No competitions yet. Create one to get started.
          </Card>
        ) : (
          <div className="space-y-3">
            {contests.map((c) => (
              <Card
                key={c.id}
                className="p-4 sm:p-5 cursor-pointer hover:border-primary-300 dark:hover:border-primary-500/40 border border-transparent transition-colors"
                onClick={() => onOpenContest(c.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-ink/50 dark:text-white/50 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {formatDhaka(c.start_at)} → {formatDhaka(c.end_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    <Badge tone="neutral">
                      {c.answer_mode === 'voice' ? '🎤 Voice' : '⌨️ Keyboard'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
