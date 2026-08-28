import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { AdminLeaderboardRow, AnswerResult, IntegrityStatus } from '../../../types/competition';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface SubmissionDetail {
  results: AnswerResult[];
  paste_attempts: number;
  copy_attempts: number;
  cut_attempts: number;
  drop_attempts: number;
  tab_switches: number;
  refresh_count: number;
  integrity_status: IntegrityStatus;
  integrity_override: IntegrityStatus | null;
}

interface ParticipantDetailModalProps {
  row: AdminLeaderboardRow | null;
  onClose: () => void;
  onOverrideIntegrity: (submissionId: string, status: IntegrityStatus) => Promise<void>;
}

const TONE: Record<IntegrityStatus, 'primary' | 'amber' | 'rose'> = {
  green: 'primary',
  yellow: 'amber',
  red: 'rose',
};
const ICON: Record<IntegrityStatus, string> = { green: '🟢', yellow: '🟡', red: '🔴' };

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  row,
  onClose,
  onOverrideIntegrity,
}) => {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!row) {
      setDetail(null);
      return;
    }
    setLoading(true);
    supabase
      .from('submissions')
      .select(
        'results, paste_attempts, copy_attempts, cut_attempts, drop_attempts, tab_switches, refresh_count, integrity_status, integrity_override'
      )
      .eq('id', row.submission_id)
      .maybeSingle()
      .then(({ data }) => {
        setDetail((data as SubmissionDetail) ?? null);
        setLoading(false);
      });
  }, [row]);

  return (
    <AnimatePresence>
      {row && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-surface dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold">{row.full_name}</h3>
                <p className="text-xs text-ink/50 dark:text-white/50">{row.participant_identifier}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <Badge tone="primary">Score {row.score}/10</Badge>
              <Badge tone={TONE[row.integrity_status]}>
                {ICON[row.integrity_status]} {row.integrity_status}
              </Badge>
            </div>

            {loading && <p className="text-sm text-ink/50 dark:text-white/50">Loading…</p>}

            {detail && (
              <>
                <div className="space-y-2 mb-6">
                  {detail.results
                    .sort((a, b) => a.question_number - b.question_number)
                    .map((r) => (
                      <div
                        key={r.question_number}
                        className="flex items-start gap-2.5 text-sm bg-black/[0.03] dark:bg-white/5 rounded-lg px-3 py-2"
                      >
                        {r.correct ? (
                          <Check size={15} className="text-primary-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs text-ink/45 dark:text-white/45">Question {r.question_number}</p>
                          <p className="font-medium">{r.answer || <span className="italic opacity-50">blank</span>}</p>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="border-t border-black/5 dark:border-white/10 pt-4">
                  <p className="text-xs font-semibold uppercase text-ink/45 dark:text-white/45 mb-2.5">
                    Integrity Signals
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <IntegrityStat label="Paste" value={detail.paste_attempts} />
                    <IntegrityStat label="Copy" value={detail.copy_attempts} />
                    <IntegrityStat label="Cut" value={detail.cut_attempts} />
                    <IntegrityStat label="Drop" value={detail.drop_attempts} />
                    <IntegrityStat label="Tab Switches" value={detail.tab_switches} />
                    <IntegrityStat label="Refreshes" value={detail.refresh_count} />
                  </div>

                  <p className="text-xs text-ink/50 dark:text-white/50 mb-2">
                    Admin override (final decision):
                  </p>
                  <div className="flex gap-2">
                    {(['green', 'yellow', 'red'] as IntegrityStatus[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={
                          (detail.integrity_override ?? detail.integrity_status) === s ? 'primary' : 'secondary'
                        }
                        onClick={() => onOverrideIntegrity(row.submission_id, s)}
                      >
                        {ICON[s]} {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const IntegrityStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-black/[0.03] dark:bg-white/5 rounded-lg py-2">
    <p className="font-display font-semibold text-base">{value}</p>
    <p className="text-ink/45 dark:text-white/45">{label}</p>
  </div>
);
