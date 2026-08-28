import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AdminLeaderboardRow } from '../../../types/competition';

export function useAdminLeaderboard(contestId: string | null) {
  const [rows, setRows] = useState<AdminLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contestId) return;
    const { data, error: fetchError } = await supabase
      .from('admin_leaderboard')
      .select('*')
      .eq('contest_id', contestId)
      .order('rank', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setRows((data ?? []) as AdminLeaderboardRow[]);
    }
    setLoading(false);
  }, [contestId]);

  useEffect(() => {
    if (!contestId) return;
    setLoading(true);
    refresh();

    // The admin_leaderboard view can't be subscribed to directly (Realtime
    // only works on real tables), so we listen on the underlying
    // submissions table and re-fetch the ranked view whenever a row for
    // this contest changes — new submission, or an admin's integrity
    // override.
    const channel = supabase
      .channel(`submissions-contest-${contestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `contest_id=eq.${contestId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, refresh]);

  return { rows, loading, error, refresh };
}
