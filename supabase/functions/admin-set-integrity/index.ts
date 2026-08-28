// POST /functions/v1/admin-set-integrity
// Requires an admin session. Lets a human make the final call on a
// submission's integrity status, per the "never auto-disqualify" rule —
// the automatic classification (integrity_status) is left untouched as a
// record of the original heuristic; integrity_override is what the admin
// dashboard and CSV export actually display.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

const VALID = ['green', 'yellow', 'red'];

interface Body {
  submissionId?: string;
  status?: string;
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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { submissionId, status } = body;
  if (!submissionId || !status || !VALID.includes(status)) {
    return jsonResponse({ error: 'A valid submissionId and status are required.' }, 400);
  }

  const db = getAdminClient();
  const { error } = await db
    .from('submissions')
    .update({ integrity_override: status })
    .eq('id', submissionId);

  if (error) {
    console.error('admin-set-integrity error', error);
    return jsonResponse({ error: 'Could not update integrity status.' }, 500);
  }

  return jsonResponse({ submissionId, integrityOverride: status });
});
