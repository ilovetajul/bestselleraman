import type { SRSData } from '../types';

export function createInitialSRS(principleId: number): SRSData {
  return {
    principleId,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewed: null,
    nextReview: null,
    difficulty: 0.5,
    masteryScore: 0,
  };
}

/**
 * Suggested review intervals:
 * - First mistake: review again in the same session (nextReview = now)
 * - Correct once: review after 1 day
 * - Correct twice: review after 3 days
 * - Correct three times: review after 7 days
 * - Strong mastery (4+): review after 15 days
 */
export function updateSRSAfterAnswer(srs: SRSData, correct: boolean): SRSData {
  const now = new Date();
  const updated: SRSData = { ...srs, lastReviewed: now.toISOString() };

  if (correct) {
    updated.correctCount += 1;
    updated.difficulty = Math.max(0, Number((updated.difficulty - 0.15).toFixed(2)));

    let daysUntilNext = 15;
    if (updated.correctCount === 1) daysUntilNext = 1;
    else if (updated.correctCount === 2) daysUntilNext = 3;
    else if (updated.correctCount === 3) daysUntilNext = 7;

    const next = new Date(now);
    next.setDate(next.getDate() + daysUntilNext);
    updated.nextReview = next.toISOString();

    const accuracy =
      updated.correctCount / (updated.correctCount + updated.incorrectCount + 0.001);
    updated.masteryScore = Math.min(
      100,
      Math.round(accuracy * 70 + Math.min(updated.correctCount * 8, 30))
    );
  } else {
    updated.incorrectCount += 1;
    updated.difficulty = Math.min(1, Number((updated.difficulty + 0.25).toFixed(2)));
    // Review again in the same session
    updated.nextReview = now.toISOString();

    const accuracy =
      updated.correctCount / (updated.correctCount + updated.incorrectCount + 0.001);
    updated.masteryScore = Math.max(0, Math.round(accuracy * 70));
  }

  return updated;
}

export function isDue(srs: SRSData | undefined): boolean {
  if (!srs || !srs.nextReview) return true;
  return new Date(srs.nextReview).getTime() <= Date.now();
}

export function masteryLabel(score: number): string {
  if (score >= 90) return 'Mastered';
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Building';
  if (score > 0) return 'Fragile';
  return 'New';
}
