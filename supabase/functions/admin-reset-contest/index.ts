// POST /functions/v1/admin-reset-contest
// Requires an admin session AND the literal string "RESET" as confirmText.
// Permanently deletes all submissions and participants for a contest.
// The contest itself and its questions are left intact so it can be re-run.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

interface ResetBody {
  contestId?: string;
  confirmText?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const admin = await requireAdmin(req);
  if (!admin) {
    return jsonResponse({ error: 'Admin authentication required.' }, 401);
  }

  let body: ResetBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId, confirmText } = body;

  if (!contestId) {
    return jsonResponse({ error: 'contestId is required.' }, 400);
  }
  if (confirmText !== 'RESET') {
    return jsonResponse({ error: 'You must type RESET exactly to confirm this action.' }, 400);
  }

  const db = getAdminClient();

  const { data: contest, error: contestError } = await db
    .from('contests')
    .select('id')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError || !contest) {
    return jsonResponse({ error: 'Contest not found.' }, 404);
  }

  // submissions reference participants with ON DELETE CASCADE, but we
  // delete explicitly and in order for a clear audit trail in the logs.
  const { error: submissionsError } = await db.from('submissions').delete().eq('contest_id', contestId);
  if (submissionsError) {
    console.error('admin-reset-contest submissions delete error', submissionsError);
    return jsonResponse({ error: 'Could not clear submissions.' }, 500);
  }

  const { error: participantsError } = await db.from('participants').delete().eq('contest_id', contestId);
  if (participantsError) {
    console.error('admin-reset-contest participants delete error', participantsError);
    return jsonResponse({ error: 'Could not clear participants.' }, 500);
  }

  const { error: publishError } = await db
    .from('contests')
    .update({ results_published: false })
    .eq('id', contestId);
  if (publishError) {
    console.error('admin-reset-contest publish reset error', publishError);
  }

  return jsonResponse({ contestId, reset: true });
});
