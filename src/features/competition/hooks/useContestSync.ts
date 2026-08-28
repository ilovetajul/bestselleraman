import { useCallback, useEffect, useRef, useState } from 'react';
import { callFunction, isSupabaseConfigured } from '../../../lib/supabase';
import type { ContestPublic } from '../../../types/competition';

interface ContestStatusResponse {
  serverTime: string;
  contest: ContestPublic | null;
}

interface UseContestSyncResult {
  contest: ContestPublic | null;
  loading: boolean;
  error: string | null;
  /** Best estimate of the current server time — use this, never Date.now(), for anything timing-related. */
  serverNow: () => Date;
  refresh: () => Promise<void>;
}

/**
 * Polls the public contest-status Edge Function so the UI reflects the
 * SERVER's view of contest status and clock, never the device's own clock.
 * The offset is recomputed on every poll to correct for drift.
 */
export function useContestSync(
  contestId: string | undefined,
  pollIntervalMs: number | null = 5000
): UseContestSyncResult {
  const [contest, setContest] = useState<ContestPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Competition mode is not configured yet.');
      setLoading(false);
      return;
    }
    try {
      const fetchedAt = Date.now();
      const res = await callFunction<ContestStatusResponse>(
        'contest-status',
        contestId ? { contestId } : {},
        { method: 'GET' }
      );
      const roundTrip = Date.now() - fetchedAt;
      const serverTimeMs = new Date(res.serverTime).getTime();
      // Adjust for roughly half the round-trip so the offset targets the
      // moment the server actually generated its timestamp, not when the
      // response arrived back.
      offsetRef.current = serverTimeMs + roundTrip / 2 - Date.now();
      setContest(res.contest);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the competition server.');
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    refresh();
    if (!pollIntervalMs) return;
    const id = window.setInterval(refresh, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [refresh, pollIntervalMs]);

  const serverNow = useCallback(() => new Date(Date.now() + offsetRef.current), []);

  return { contest, loading, error, serverNow, refresh };
}
