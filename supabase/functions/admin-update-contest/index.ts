// POST /functions/v1/admin-update-contest
// Requires an admin session. Only allowed while a contest is still 'draft'
// or 'scheduled' — once it's 'live' or 'finished', editing the schedule out
// from under registered participants would be unsafe and confusing, so
// that's blocked here server-side (not just hidden in the UI).

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';

interface UpdateContestBody {
  contestId?: string;
  name?: string;
  startAt?: string;
  endAt?: string;
  durationSeconds?: number;
  requireContact?: boolean;
  answerMode?: 'keyboard' | 'voice';
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

  let body: UpdateContestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId } = body;
  if (!contestId) {
    return jsonResponse({ error: 'contestId is required.' }, 400);
  }

  const db = getAdminClient();

  const { data: existing, error: fetchError } = await db
    .from('contests')
    .select('id, status')
    .eq('id', contestId)
    .maybeSingle();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Contest not found.' }, 404);
  }

  if (existing.status !== 'draft' && existing.status !== 'scheduled') {
    return jsonResponse(
      { error: 'Only draft or scheduled competitions can be edited. This one has already started or finished.' },
      409
    );
  }

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, 200);
    if (!name) return jsonResponse({ error: 'Competition name cannot be empty.' }, 400);
    update.name = name;
  }

  let startAt: Date | null = null;
  let endAt: Date | null = null;

  if (body.startAt !== undefined) {
    startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) {
      return jsonResponse({ error: 'A valid start date/time is required.' }, 400);
    }
    update.start_at = startAt.toISOString();
  }
  if (body.endAt !== undefined) {
    endAt = new Date(body.endAt);
    if (Number.isNaN(endAt.getTime())) {
      return jsonResponse({ error: 'A valid end date/time is required.' }, 400);
    }
    update.end_at = endAt.toISOString();
  }

  // If only one of start/end was sent, fetch the other so we can validate
  // end > start against the final resulting pair, not just the one field.
  if ((startAt && !endAt) || (endAt && !startAt)) {
    const { data: current } = await db
      .from('contests')
      .select('start_at, end_at')
      .eq('id', contestId)
      .maybeSingle();
    if (current) {
      if (!startAt) startAt = new Date(current.start_at);
      if (!endAt) endAt = new Date(current.end_at);
    }
  }
  if (startAt && endAt && endAt <= startAt) {
    return jsonResponse({ error: 'End time must be after start time.' }, 400);
  }

  if (body.durationSeconds !== undefined) {
    const durationSeconds = Math.floor(body.durationSeconds);
    if (!durationSeconds || durationSeconds <= 0) {
      return jsonResponse({ error: 'Duration (in minutes) must be greater than zero.' }, 400);
    }
    update.duration_seconds = durationSeconds;
  }

  if (body.requireContact !== undefined) {
    update.require_contact = !!body.requireContact;
  }

  if (body.answerMode !== undefined) {
    update.answer_mode = body.answerMode === 'voice' ? 'voice' : 'keyboard';
  }

  if (Object.keys(update).length === 0) {
    return jsonResponse({ error: 'Nothing to update.' }, 400);
  }

  const { data: updated, error: updateError } = await db
    .from('contests')
    .update(update)
    .eq('id', contestId)
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    console.error('admin-update-contest error', updateError);
    return jsonResponse({ error: 'Could not update contest.' }, 500);
  }

  return jsonResponse({ contestId });
});
