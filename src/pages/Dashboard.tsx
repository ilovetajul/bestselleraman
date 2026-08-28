import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Flame, CalendarClock, Zap, Target } from 'lucide-react';
import { PRINCIPLES } from '../data/principles';
import { isDue, masteryLabel } from '../lib/srs';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; tone?: string }> = ({
  icon,
  label,
  value,
  tone = 'text-primary-600 dark:text-primary-300',
}) => (
  <Card className="p-4 sm:p-5 flex items-center gap-3.5">
    <div className={`w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center ${tone}`}>
      {icon}
    </div>
    <div>
      <p className="text-xl font-display font-semibold leading-tight">{value}</p>
      <p className="text-xs text-ink/50 dark:text-white/50">{label}</p>
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { progress } = useApp();

  const ranked = useMemo(() => {
    return PRINCIPLES.map((p) => ({
      principle: p,
      srs: progress.srs[p.id],
    })).sort((a, b) => (a.srs?.masteryScore ?? 0) - (b.srs?.masteryScore ?? 0));
  }, [progress.srs]);

  const overallMastery = Math.round(
    ranked.reduce((sum, r) => sum + (r.srs?.masteryScore ?? 0), 0) / Math.max(1, ranked.length)
  );

  const dueToday = ranked.filter((r) => isDue(r.srs)).length;
  const weakest = ranked.slice(0, 3);
  const strongest = [...ranked].reverse().slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink/55 dark:text-white/55 mt-1">
          Your recall performance across all 10 principles.
        </p>
      </div>

      <Card className="p-6 sm:p-7">
        <ProgressBar
          value={overallMastery}
          label="Overall Mastery"
          height="h-3"
          colorClass="bg-primary-500"
        />
        <p className="text-sm text-ink/50 dark:text-white/50 mt-3">
          XP earned: <span className="font-semibold text-ink dark:text-white">{progress.xp}</span> · Badges:{' '}
          <span className="font-semibold text-ink dark:text-white">{progress.badges.length}</span>
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target size={18} />} label="Questions Completed" value={progress.totalQuestionsCompleted} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Correct Answers" value={progress.totalCorrect} tone="text-primary-600 dark:text-primary-300" />
        <StatCard icon={<XCircle size={18} />} label="Mistakes" value={progress.totalMistakes} tone="text-rose-500" />
        <StatCard icon={<Flame size={18} />} label="Current Streak" value={`${progress.streakDays}d`} tone="text-amber-500" />
        <StatCard icon={<CalendarClock size={18} />} label="Today's Review" value={dueToday} />
        <StatCard icon={<Zap size={18} />} label="120s Recall Score" value={`${progress.bestSpeedRecallScore}/10`} tone="text-amber-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display font-semibold mb-4">Weakest Principles</h2>
          <div className="space-y-3.5">
            {weakest.map(({ principle, srs }) => (
              <motion.div key={principle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{principle.keyword}</span>
                  <Badge tone="rose">{masteryLabel(srs?.masteryScore ?? 0)}</Badge>
                </div>
                <ProgressBar value={srs?.masteryScore ?? 0} colorClass="bg-rose-500" height="h-1.5" />
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display font-semibold mb-4">Strongest Principles</h2>
          <div className="space-y-3.5">
            {strongest.map(({ principle, srs }) => (
              <motion.div key={principle.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{principle.keyword}</span>
                  <Badge tone="primary">{masteryLabel(srs?.masteryScore ?? 0)}</Badge>
                </div>
                <ProgressBar value={srs?.masteryScore ?? 0} colorClass="bg-primary-500" height="h-1.5" />
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {progress.badges.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h2 className="font-display font-semibold mb-4">Badges Earned</h2>
          <div className="flex flex-wrap gap-2">
            {progress.badges.map((b, i) => (
              <Badge key={`${b}-${i}`} tone="amber">
                🏅 {b.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
