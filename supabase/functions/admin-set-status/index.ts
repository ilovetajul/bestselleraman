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
                                                                    // Fetch the configured duration so the end time moves forward with the
                                                                        // start time. Without this, "Start Now" clicked any time after the
                                                                            // originally scheduled end_at would try to set start_at to a value
                                                                                // AFTER the still-old end_at — violating the end_after_start check
                                                                                    // constraint and failing with a generic error.
                                                                                        const { data: existing, error: fetchError } = await db
                                                                                              .from('contests')
                                                                                                    .select('duration_seconds')
                                                                                                          .eq('id', contestId)
                                                                                                                .maybeSingle();

                                                                                                                    if (fetchError || !existing) {
                                                                                                                          return jsonResponse({ error: 'Contest not found.' }, 404);
                                                                                                                              }

                                                                                                                                  const newStart = now;
                                                                                                                                      const newEnd = new Date(now.getTime() + existing.duration_seconds * 1000);
                                                                                                                                          update.start_at = newStart.toISOString();
                                                                                                                                              update.end_at = newEnd.toISOString();
                                                                                                                                                }

                                                                                                                                                  if (status === 'finished' && body.adjustEndToNow) {
                                                                                                                                                      // Symmetric safety check: end_at must stay after start_at even in the
                                                                                                                                                          // unlikely case "End Competition" is clicked in the same instant as
                                                                                                                                                              // (or somehow before) the contest's own start_at.
                                                                                                                                                                  const { data: existing } = await db
                                                                                                                                                                        .from('contests')
                                                                                                                                                                              .select('start_at')
                                                                                                                                                                                    .eq('id', contestId)
                                                                                                                                                                                          .maybeSingle();

                                                                                                                                                                                              const startAt = existing ? new Date(existing.start_at) : null;
                                                                                                                                                                                                  const candidate = now;
                                                                                                                                                                                                      update.end_at =
                                                                                                                                                                                                            startAt && candidate.getTime() <= startAt.getTime()
                                                                                                                                                                                                                    ? new Date(startAt.getTime() + 1000).toISOString()
                                                                                                                                                                                                                            : candidate.toISOString();
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