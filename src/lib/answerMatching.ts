import type { MatchResult } from '../types';

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ');
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Evaluates a user's answer against the expected answer.
 * - Exact match (after normalizing case/punctuation/spacing) -> 'correct'
 * - Close-but-wrong (small edit distance, or most words shared) -> 'almost'
 * - Otherwise -> 'incorrect'
 */
export function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  strict: boolean
): MatchResult {
  const u = normalize(userAnswer);
  const c = normalize(correctAnswer);

  if (!u) return 'incorrect';
  if (u === c) return 'correct';
  if (strict) return 'incorrect';

  const distance = levenshtein(u, c);
  const tolerance = Math.max(1, Math.floor(c.length * 0.22));
  if (distance <= tolerance) return 'almost';

  const cWords = c.split(' ').filter(Boolean);
  const uWords = u.split(' ').filter(Boolean);
  if (cWords.length > 1) {
    const shared = uWords.filter((w) => cWords.includes(w)).length;
    if (shared / cWords.length >= 0.6) return 'almost';
  } else if (cWords.length === 1 && uWords.length === 1) {
    // single-word keyword answers: allow a slightly wider typo tolerance
    if (distance <= Math.max(2, Math.floor(c.length * 0.3))) return 'almost';
  }

  return 'incorrect';
}
