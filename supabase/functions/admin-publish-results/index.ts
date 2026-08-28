// POST /functions/v1/admin-publish-results
// Requires an admin session. Only allowed once a contest is finished.
// Flips results_published, which is what public_results (and therefore the
// participant Results page) checks before showing anything.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

interface PublishBody {
  contestId?: string;
  publish?: boolean; // true = publish, false = unpublish
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

  let body: PublishBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId } = body;
  const publish = body.publish !== false; // default true

  if (!contestId) {
    return jsonResponse({ error: 'contestId is required.' }, 400);
  }

  const db = getAdminClient();

  const { data: contest, error: contestError } = await db
    .from('contests')
    .select('id, status')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError || !contest) {
    return jsonResponse({ error: 'Contest not found.' }, 404);
  }

  if (publish && contest.status !== 'finished') {
    return jsonResponse(
      { error: 'Results can only be published after the contest has finished.' },
      409
    );
  }

  const { error: updateError } = await db
    .from('contests')
    .update({ results_published: publish })
    .eq('id', contestId);

  if (updateError) {
    console.error('admin-publish-results error', updateError);
    return jsonResponse({ error: 'Could not update publish status.' }, 500);
  }

  return jsonResponse({ contestId, resultsPublished: publish });
});
