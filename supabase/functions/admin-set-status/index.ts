// POST /functions/v1/admin-set-status
// Requires an admin session. Drives the Draft → Scheduled → Live → Finished
// buttons in the admin dashboard.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

const VALID_STATUSES = ['draft', 'scheduled', 'live', 'finished'];

interface SetStatusBody {
  contestId?: string;
  status?: string;
  adjustStartToNow?: boolean; // used by "Start Now"
  adjustEndToNow?: boolean; // used by "End Competition"
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

  let body: SetStatusBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId, status } = body;
  if (!contestId || !status || !VALID_STATUSES.includes(status)) {
    return jsonResponse({ error: 'A valid contestId and status are required.' }, 400);
  }

  const db = getAdminClient();
  const now = new Date();

  const update: Record<string, unknown> = { status };

  if (status === 'live' && body.adjustStartToNow) {
    update.start_at = now.toISOString();
  }
  if (status === 'finished' && body.adjustEndToNow) {
    update.end_at = now.toISOString();
  }

  const { data, error } = await db
    .from('contests')
    .update(update)
    .eq('id', contestId)
    .select('id, status, start_at, end_at')
    .maybeSingle();

  if (error || !data) {
    console.error('admin-set-status error', error);
    return jsonResponse({ error: 'Could not update contest status.' }, 500);
  }

  return jsonResponse({ contest: data });
});
