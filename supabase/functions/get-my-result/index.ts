// POST /functions/v1/get-my-result
//
// Participants have no password-based login, so identity here is proven the
// same lightweight way registration works: contestId + participantIdentifier
// + matching full name. This is appropriate for an internal company
// competition (Employee ID acts as the shared-secret identity) but is not a
// strong authentication mechanism — documented clearly in the deployment
// notes. Only returns data once the admin has published results.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabaseAdmin.ts';

interface ResultBody {
  contestId?: string;
  participantIdentifier?: string;
  fullName?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: ResultBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const contestId = typeof body.contestId === 'string' ? body.contestId.trim() : '';
  const participantIdentifier =
    typeof body.participantIdentifier === 'string' ? body.participantIdentifier.trim() : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';

  if (!contestId || !participantIdentifier || !fullName) {
    return jsonResponse(
      { error: 'contestId, participantIdentifier, and fullName are required.' },
      400
    );
  }

  const db = getAdminClient();

  const { data: contest, error: contestError } = await db
    .from('contests')
    .select('id, name, results_published')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError || !contest) {
    return jsonResponse({ error: 'Contest not found.' }, 404);
  }

  if (!contest.results_published) {
    return jsonResponse({ error: 'Results have not been published yet.' }, 409);
  }

  const { data: participant, error: participantError } = await db
    .from('participants')
    .select('id, full_name')
    .eq('contest_id', contestId)
    .eq('participant_identifier', participantIdentifier)
    .maybeSingle();

  if (
    participantError ||
    !participant ||
    participant.full_name.trim().toLowerCase() !== fullName.toLowerCase()
  ) {
    return jsonResponse({ error: 'No matching registration found.' }, 404);
  }

  // Pull every submission for this contest, in official ranking order, so we
  // can report this participant's rank and the top 3 in one pass.
  const { data: allSubmissions, error: allError } = await db
    .from('submissions')
    .select('id, participant_id, correct_count, score, submitted_at, results')
    .eq('contest_id', contestId)
    .order('correct_count', { ascending: false })
    .order('submitted_at', { ascending: true })
    .order('submission_seq', { ascending: true });

  if (allError || !allSubmissions) {
    return jsonResponse({ error: 'Could not load results.' }, 500);
  }

  const myIndex = allSubmissions.findIndex((s) => s.participant_id === participant.id);
  if (myIndex === -1) {
    return jsonResponse({ error: 'No submission found for this participant.' }, 404);
  }

  const mine = allSubmissions[myIndex];

  // Look up names for the top 3 only (never expose the full roster).
  const topThreeIds = allSubmissions.slice(0, 3).map((s) => s.participant_id);
  const { data: topParticipants } = await db
    .from('participants')
    .select('id, full_name')
    .in('id', topThreeIds.length ? topThreeIds : ['00000000-0000-0000-0000-000000000000']);

  const nameById = new Map((topParticipants ?? []).map((p) => [p.id, p.full_name]));

  const topThree = allSubmissions.slice(0, 3).map((s, i) => ({
    rank: i + 1,
    fullName: nameById.get(s.participant_id) ?? 'Participant',
    score: s.correct_count,
    submittedAt: s.submitted_at,
  }));

  return jsonResponse({
    contestName: contest.name,
    fullName: participant.full_name,
    correctCount: mine.correct_count,
    wrongCount: 10 - mine.correct_count,
    score: mine.score,
    submittedAt: mine.submitted_at,
    rank: myIndex + 1,
    totalParticipants: allSubmissions.length,
    results: mine.results,
    topThree,
  });
});
