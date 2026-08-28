import type { MatchResult, UserProgress } from '../types';

export const XP_RULES = {
  correct: 10,
  almost: 4,
  incorrect: 1,
};

export function xpForResult(result: MatchResult): number {
  if (result === 'correct') return XP_RULES.correct;
  if (result === 'almost') return XP_RULES.almost;
  return XP_RULES.incorrect;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function updateStreakOnActivity(progress: UserProgress): {
  streakDays: number;
  lastActiveDate: string;
} {
  const today = todayKey();
  if (!progress.lastActiveDate) {
    return { streakDays: 1, lastActiveDate: today };
  }
  const gap = daysBetween(progress.lastActiveDate, today);
  if (gap === 0) {
    return { streakDays: progress.streakDays || 1, lastActiveDate: today };
  }
  if (gap === 1) {
    return { streakDays: (progress.streakDays || 0) + 1, lastActiveDate: today };
  }
  return { streakDays: 1, lastActiveDate: today };
}

export const BADGE_DEFS: Record<string, { label: string; description: string }> = {
  'three-in-a-row': { label: '3 In A Row', description: 'Three correct answers back to back.' },
  'perfect-recall': { label: 'Perfect Recall', description: 'A flawless full-test attempt.' },
  'ten-of-ten-master': { label: '10/10 Master', description: 'Mastered all 10 principles.' },
  'week-streak': { label: '7-Day Streak', description: 'Practiced 7 days in a row.' },
  'speed-star': { label: 'Speed Star', description: 'Recalled 8+ in the 30-second challenge.' },
};

export function computeNewBadges(
  progress: UserProgress,
  context: { fullTestPerfect?: boolean; masteredAllTen?: boolean; speedScore?: number }
): string[] {
  const earned = new Set(progress.badges);
  const fresh: string[] = [];

  const add = (id: string) => {
    if (!earned.has(id)) {
      earned.add(id);
      fresh.push(id);
    }
  };

  if (progress.sessionCorrectStreak >= 3) add('three-in-a-row');
  if (context.fullTestPerfect) add('perfect-recall');
  if (context.masteredAllTen) add('ten-of-ten-master');
  if (progress.streakDays >= 7) add('week-streak');
  if (context.speedScore !== undefined && context.speedScore >= 8) add('speed-star');

  return fresh;
}
