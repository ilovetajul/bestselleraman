// POST /functions/v1/admin-delete-contest
// Requires an admin session AND the literal string "DELETE" as confirmText.
// Permanently removes the contest row — contest_questions, participants,
// and submissions all cascade-delete via their foreign keys. Unlike
// admin-reset-contest (which clears participants/submissions but keeps the
// contest so it can be re-run), this removes the contest entry itself.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

interface DeleteBody {
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

  let body: DeleteBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId, confirmText } = body;
  if (!contestId) {
    return jsonResponse({ error: 'contestId is required.' }, 400);
  }
  if (confirmText !== 'DELETE') {
    return jsonResponse({ error: 'You must type DELETE exactly to confirm this action.' }, 400);
  }

  const db = getAdminClient();
  const { error } = await db.from('contests').delete().eq('id', contestId);

  if (error) {
    console.error('admin-delete-contest error', error);
    return jsonResponse({ error: 'Could not delete contest.' }, 500);
  }

  return jsonResponse({ contestId, deleted: true });
});
