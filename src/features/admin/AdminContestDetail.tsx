import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Play,
  Square,
  Eye,
  EyeOff,
  Trash2,
  Users,
  CheckCircle2,
  Award,
  ShieldAlert,
} from 'lucide-react';
import { supabase, callFunction } from '../../lib/supabase';
import { useAdminLeaderboard } from './hooks/useAdminLeaderboard';
import { exportLeaderboardCsv } from './lib/csv';
import { ParticipantDetailModal } from './components/ParticipantDetailModal';
import { TypedConfirmDialog } from './components/TypedConfirmDialog';
import { StatCard } from './components/StatCard';
import type { AdminContestRow, AdminLeaderboardRow, IntegrityStatus } from '../../types/competition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type ScoreFilter = 'all' | 'valid' | 'review' | 'suspicious' | '10' | '9' | '8' | '7-below';
type SortKey = 'score' | 'submission-time' | 'name' | 'completion-time';

function formatDhaka(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

function formatCompletion(seconds: number | null): string {
  if (seconds === null) return '—';
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface AdminContestDetailProps {
  contestId: string;
  onBack: () => void;
}

export const AdminContestDetail: React.FC<AdminContestDetailProps> = ({ contestId, onBack }) => {
  const [contest, setContest] = useState<AdminContestRow | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const { rows, refresh } = useAdminLeaderboard(contestId);
  const [filter, setFilter] = useState<ScoreFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [selectedRow, setSelectedRow] = useState<AdminLeaderboardRow | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadContest = async () => {
    const { data } = await supabase
      .from('contests')
      .select('id, name, timezone, start_at, end_at, duration_seconds, status, results_published, answer_mode, created_at')
      .eq('id', contestId)
      .maybeSingle();
    setContest((data as AdminContestRow) ?? null);

    const { count } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('contest_id', contestId);
    setParticipantCount(count ?? 0);
  };

  useEffect(() => {
    loadContest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  const stats = useMemo(() => {
    const submitted = rows.length;
    const perfect = rows.filter((r) => r.correct_count === 10).length;
    const suspicious = rows.filter((r) => r.integrity_status === 'red').length;
    const avg = submitted ? rows.reduce((sum, r) => sum + r.correct_count, 0) / submitted : 0;
    return { submitted, perfect, suspicious, avg };
  }, [rows]);

  const topThree = useMemo(() => rows.filter((r) => r.rank <= 3).slice(0, 3), [rows]);

  const filteredSorted = useMemo(() => {
    let list = [...rows];
    if (filter === 'valid') list = list.filter((r) => r.integrity_status === 'green');
    else if (filter === 'review') list = list.filter((r) => r.integrity_status === 'yellow');
    else if (filter === 'suspicious') list = list.filter((r) => r.integrity_status === 'red');
    else if (filter === '10') list = list.filter((r) => r.correct_count === 10);
    else if (filter === '9') list = list.filter((r) => r.correct_count === 9);
    else if (filter === '8') list = list.filter((r) => r.correct_count === 8);
    else if (filter === '7-below') list = list.filter((r) => r.correct_count <= 7);

    switch (sortKey) {
      case 'name':
        list.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'completion-time':
        list.sort((a, b) => (a.duration_seconds ?? 0) - (b.duration_seconds ?? 0));
        break;
      case 'submission-time':
        list.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
        break;
      default:
        list.sort((a, b) => a.rank - b.rank);
    }
    return list;
  }, [rows, filter, sortKey]);

  const runAction = async (fn: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await loadContest();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status: string, extra: Record<string, unknown> = {}) =>
    runAction(async () => {
      await callFunction('admin-set-status', { contestId, status, ...extra }, { authed: true });
    });

  const togglePublish = (publish: boolean) =>
    runAction(async () => {
      await callFunction('admin-publish-results', { contestId, publish }, { authed: true });
    });

  const handleReset = () =>
    runAction(async () => {
      await callFunction('admin-reset-contest', { contestId, confirmText: 'RESET' }, { authed: true });
      setResetOpen(false);
      await refresh();
    });

  const handleOverrideIntegrity = async (submissionId: string, status: IntegrityStatus) => {
    await callFunction('admin-set-integrity', { submissionId, status }, { authed: true });
    await refresh();
  };

  if (!contest) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink-dark flex items-center justify-center">
        <p className="text-sm text-ink/50 dark:text-white/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-ink-dark">
      <header className="flex items-center gap-3 px-5 sm:px-8 py-4 border-b border-black/5 dark:border-white/10">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold truncate">{contest.name}</p>
          <p className="text-xs text-ink/50 dark:text-white/50">
            {formatDhaka(contest.start_at)} → {formatDhaka(contest.end_at)} (Bangladesh Time)
          </p>
        </div>
        <Badge tone="neutral">{contest.answer_mode === 'voice' ? '🎤 Voice' : '⌨️ Keyboard'}</Badge>
        <Badge tone={contest.status === 'live' ? 'primary' : contest.status === 'finished' ? 'rose' : 'amber'}>
          {contest.status}
        </Badge>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ---- controls ---- */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2.5">
            {contest.status === 'draft' && (
              <Button size="sm" disabled={busy} onClick={() => setStatus('scheduled')}>
                Schedule Competition
              </Button>
            )}
            {(contest.status === 'draft' || contest.status === 'scheduled') && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Play size={14} />}
                disabled={busy}
                onClick={() => setStatus('live', { adjustStartToNow: true })}
              >
                Start Now
              </Button>
            )}
            {contest.status === 'live' && (
              <Button
                size="sm"
                variant="danger"
                icon={<Square size={14} />}
                disabled={busy}
                onClick={() => setStatus('finished', { adjustEndToNow: true })}
              >
                End Competition
              </Button>
            )}
            {contest.status === 'finished' && (
              <Button
                size="sm"
                variant="secondary"
                icon={contest.results_published ? <EyeOff size={14} /> : <Eye size={14} />}
                disabled={busy}
                onClick={() => togglePublish(!contest.results_published)}
              >
                {contest.results_published ? 'Unpublish Results' : 'Publish Results'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<Download size={14} />}
              onClick={() => exportLeaderboardCsv(rows, contest.name)}
            >
              Export CSV
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => setResetOpen(true)}>
              Reset Contest
            </Button>
          </div>
          {actionError && <p className="text-sm text-rose-600 dark:text-rose-300 mt-3">{actionError}</p>}
        </Card>

        {/* ---- top 3 ---- */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topThree.map((r) => (
              <Card key={r.submission_id} className="p-4 text-center">
                <p className="text-2xl mb-1">{RANK_MEDAL[r.rank]}</p>
                <p className="font-display font-semibold">{r.full_name}</p>
                <p className="text-xs text-ink/50 dark:text-white/50">
                  {r.score}/10 · {formatDhaka(r.submitted_at)}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* ---- live stats ---- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total Registered" value={participantCount ?? '—'} icon={<Users size={15} />} />
          <StatCard label="Submitted" value={stats.submitted} icon={<CheckCircle2 size={15} />} />
          <StatCard
            label="Not Yet Submitted"
            value={participantCount !== null ? Math.max(0, participantCount - stats.submitted) : '—'}
          />
          <StatCard label="Perfect Scores" value={stats.perfect} icon={<Award size={15} />} />
          <StatCard label="Average Score" value={stats.avg.toFixed(1)} />
          <StatCard
            label="Suspicious"
            value={stats.suspicious}
            icon={<ShieldAlert size={15} />}
            tone="text-rose-500"
          />
        </div>

        {/* ---- filters / sort ---- */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'All'],
              ['valid', '🟢 Valid'],
              ['review', '🟡 Review'],
              ['suspicious', '🔴 Suspicious'],
              ['10', '10/10'],
              ['9', '9/10'],
              ['8', '8/10'],
              ['7-below', '≤7/10'],
            ] as [ScoreFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filter === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                  : 'border-black/10 dark:border-white/15 text-ink/60 dark:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-transparent"
          >
            <option value="score">Sort: Score</option>
            <option value="submission-time">Sort: Submission Time</option>
            <option value="name">Sort: Name</option>
            <option value="completion-time">Sort: Completion Time</option>
          </select>
        </div>

        {/* ---- leaderboard table ---- */}
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink/45 dark:text-white/45 border-b border-black/5 dark:border-white/10">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Integrity</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => (
                <tr
                  key={r.submission_id}
                  className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer"
                  onClick={() => setSelectedRow(r)}
                >
                  <td className="px-4 py-3 font-medium">{RANK_MEDAL[r.rank] ?? r.rank}</td>
                  <td className="px-4 py-3">{r.full_name}</td>
                  <td className="px-4 py-3 text-ink/50 dark:text-white/50">{r.participant_identifier}</td>
                  <td className="px-4 py-3 font-medium">{r.score}/10</td>
                  <td className="px-4 py-3 text-ink/50 dark:text-white/50">{formatDhaka(r.submitted_at)}</td>
                  <td className="px-4 py-3 text-ink/50 dark:text-white/50">
                    {formatCompletion(r.duration_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    {r.integrity_status === 'green' ? '🟢' : r.integrity_status === 'yellow' ? '🟡' : '🔴'}
                  </td>
                </tr>
              ))}
              {filteredSorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink/40 dark:text-white/40">
                    No submissions match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <ParticipantDetailModal
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onOverrideIntegrity={handleOverrideIntegrity}
      />

      <TypedConfirmDialog
        open={resetOpen}
        title="Reset this contest?"
        description="This will permanently delete all competition submissions and participants for this contest. The contest itself and its questions are kept, so it can be re-run."
        requiredText="RESET"
        confirmLabel="Reset Contest"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
};
