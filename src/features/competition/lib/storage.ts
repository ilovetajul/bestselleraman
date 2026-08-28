import type { StoredParticipant } from '../../../types/competition';

// This cache exists purely to skip re-typing name/ID on refresh and to know
// which contest a returning participant was mid-competition in. It is NEVER
// treated as identity proof by the server — every stage transition
// re-verifies against Supabase (register-participant is idempotent and
// returns the server's own view of alreadySubmitted).
function key(contestId: string): string {
  return `pm_participant:${contestId}`;
}

export function saveStoredParticipant(p: StoredParticipant): void {
  try {
    window.localStorage.setItem(key(p.contestId), JSON.stringify(p));
  } catch {
    // ignore — non-critical convenience cache
  }
}

export function loadStoredParticipant(contestId: string): StoredParticipant | null {
  try {
    const raw = window.localStorage.getItem(key(contestId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredParticipant;
  } catch {
    return null;
  }
}

export function clearStoredParticipant(contestId: string): void {
  try {
    window.localStorage.removeItem(key(contestId));
  } catch {
    // ignore
  }
}
