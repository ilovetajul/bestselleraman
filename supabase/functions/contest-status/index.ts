// GET /functions/v1/contest-status?contestId=xxx  (contestId optional)
//
// Public, unauthenticated endpoint. Its main job is to hand back the
// SERVER's clock so the frontend can compute an offset and never rely on
// the participant's device clock for countdowns or "is it live yet"
// decisions. If contestId is supplied, also returns that contest's public
// fields; if omitted, returns the most relevant contest (next
// scheduled/live one, falling back to the most recently finished one).

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const contestId = url.searchParams.get('contestId');
  const admin = getAdminClient();

  let contest = null;

  if (contestId) {
    const { data } = await admin
      .from('contests')
      .select('id, name, timezone, start_at, end_at, duration_seconds, status, results_published, answer_mode')
      .eq('id', contestId)
      .maybeSingle();
    contest = data ?? null;
  } else {
    const { data: activeOrUpcoming } = await admin
      .from('contests')
      .select('id, name, timezone, start_at, end_at, duration_seconds, status, results_published, answer_mode')
      .in('status', ['scheduled', 'live'])
      .order('start_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (activeOrUpcoming) {
      contest = activeOrUpcoming;
    } else {
      const { data: lastFinished } = await admin
        .from('contests')
        .select('id, name, timezone, start_at, end_at, duration_seconds, status, results_published, answer_mode')
        .eq('status', 'finished')
        .order('end_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      contest = lastFinished ?? null;
    }
  }

  return jsonResponse({
    serverTime: new Date().toISOString(),
    contest: contest
      ? {
          id: contest.id,
          name: contest.name,
          timezone: contest.timezone,
          startAt: contest.start_at,
          endAt: contest.end_at,
          durationSeconds: contest.duration_seconds,
          status: contest.status,
          resultsPublished: contest.results_published,
          answerMode: contest.answer_mode,
        }
      : null,
  });
});
