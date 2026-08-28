// POST /functions/v1/register-participant
//
// Registers a participant for a contest. If the same participant_identifier
// re-registers (e.g. after a page refresh) with a matching full name, we
// treat this as recovery rather than an error — the participant_identifier
// (e.g. Employee ID) is the participant's stable identity for the contest.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabaseAdmin.ts';

interface RegisterBody {
  contestId?: string;
  fullName?: string;
  participantIdentifier?: string;
  phone?: string;
  email?: string;
}

function clean(value: unknown, maxLen: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const contestId = clean(body.contestId, 64);
  const fullName = clean(body.fullName, 120);
  const participantIdentifier = clean(body.participantIdentifier, 80);
  const phone = clean(body.phone, 40) || null;
  const email = clean(body.email, 120) || null;

  if (!contestId || !fullName || !participantIdentifier) {
    return jsonResponse(
      { error: 'contestId, fullName, and participantIdentifier are required.' },
      400
    );
  }

  const admin = getAdminClient();

  const { data: contest, error: contestError } = await admin
    .from('contests')
    .select('id, status, require_contact')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError || !contest) {
    return jsonResponse({ error: 'Contest not found.' }, 404);
  }

  if (!['scheduled', 'live'].includes(contest.status)) {
    return jsonResponse(
      { error: 'Registration is not open for this contest right now.' },
      409
    );
  }

  if (contest.require_contact && !phone && !email) {
    return jsonResponse({ error: 'Phone or email is required for this contest.' }, 400);
  }

  const { data: inserted, error: insertError } = await admin
    .from('participants')
    .insert({
      contest_id: contestId,
      full_name: fullName,
      participant_identifier: participantIdentifier,
      phone,
      email,
    })
    .select('id')
    .single();

  let participantId: string;

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      // Already registered — attempt refresh recovery.
      const { data: existing, error: lookupError } = await admin
        .from('participants')
        .select('id, full_name')
        .eq('contest_id', contestId)
        .eq('participant_identifier', participantIdentifier)
        .maybeSingle();

      if (lookupError || !existing) {
        return jsonResponse({ error: 'Registration failed. Please try again.' }, 500);
      }

      if (existing.full_name.trim().toLowerCase() !== fullName.toLowerCase()) {
        return jsonResponse(
          {
            error:
              'This Participant ID is already registered under a different name. Please check your ID.',
          },
          409
        );
      }

      participantId = existing.id;
    } else {
      console.error('register-participant insert error', insertError);
      return jsonResponse({ error: 'Registration failed. Please try again.' }, 500);
    }
  } else {
    participantId = inserted.id;
  }

  const { data: existingSubmission } = await admin
    .from('submissions')
    .select('id')
    .eq('participant_id', participantId)
    .maybeSingle();

  return jsonResponse({
    participantId,
    contestId,
    fullName,
    alreadySubmitted: !!existingSubmission,
    submissionId: existingSubmission?.id ?? null,
  });
});
