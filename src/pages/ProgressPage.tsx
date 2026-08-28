import React from 'react';
import { PRINCIPLES, PRINCIPLE_GROUPS } from '../data/principles';
import { masteryLabel, isDue } from '../lib/srs';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';

function formatDate(iso: string | null): string {
  if (!iso) return 'Not yet reviewed';
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.round((d.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays <= 0) return 'Due now';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

export const ProgressPage: React.FC = () => {
  const { progress } = useApp();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Progress</h1>
        <p className="text-sm text-ink/55 dark:text-white/55 mt-1">
          Mastery, spaced-repetition schedule, and history for every principle.
        </p>
      </div>

      {PRINCIPLE_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="lang-bn text-sm font-semibold text-ink/60 dark:text-white/60 mb-3">
            {group.titleBangla} · {group.titleEnglish}
          </p>
          <div className="space-y-3">
            {group.principleIds.map((id) => {
              const p = PRINCIPLES.find((pr) => pr.id === id)!;
              const srs = progress.srs[id];
              const due = isDue(srs);
              return (
                <Card key={id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <p className="font-semibold">{p.keyword}</p>
                      <p className="lang-bn text-sm text-ink/50 dark:text-white/50">{p.banglaKeyword}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone={srs?.masteryScore && srs.masteryScore >= 70 ? 'primary' : 'amber'}>
                        {masteryLabel(srs?.masteryScore ?? 0)}
                      </Badge>
                      {due && <Badge tone="rose">Due for review</Badge>}
                    </div>
                  </div>
                  <ProgressBar value={srs?.masteryScore ?? 0} height="h-1.5" />
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/50 dark:text-white/50 mt-3">
                    <span>✅ {srs?.correctCount ?? 0} correct</span>
                    <span>❌ {srs?.incorrectCount ?? 0} missed</span>
                    <span>Next review: {formatDate(srs?.nextReview ?? null)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
