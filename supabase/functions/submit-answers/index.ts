// POST /functions/v1/submit-answers
//
// This is the single most security-critical function in the system.
// The server — not the browser — decides: is the contest live right now,
// has this participant already submitted, what's correct, what's the
// score, and what time it was submitted. The client-supplied timer is
// purely a visual aid; this function is the real authority.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient } from '../_shared/supabaseAdmin.ts';
import { isCorrectAnswer } from '../_shared/normalize.ts';
import { classifyIntegrity, clampCounter } from '../_shared/integrity.ts';

interface SubmitBody {
  contestId?: string;
  participantId?: string;
  answers?: unknown;
  startedAt?: string;
  durationSeconds?: number;
  integrity?: Record<string, unknown>;
}

const QUESTION_COUNT = 10;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { contestId, participantId } = body;
  if (!contestId || !participantId) {
    return jsonResponse({ error: 'contestId and participantId are required' }, 400);
  }

  const rawAnswers = Array.isArray(body.answers) ? body.answers : [];
  const answers: string[] = Array.from({ length: QUESTION_COUNT }, (_, i) =>
    typeof rawAnswers[i] === 'string' ? (rawAnswers[i] as string).slice(0, 500) : ''
  );

  const admin = getAdminClient();

  // 1. Load the contest and verify it is genuinely live right now, using the
  //    SERVER clock — never trust the client for this.
  const { data: contest, error: contestError } = await admin
    .from('contests')
    .select('id, status, start_at, end_at')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError || !contest) {
    return jsonResponse({ error: 'Contest not found' }, 404);
  }

  const now = new Date();
  const startAt = new Date(contest.start_at);
  const endAt = new Date(contest.end_at);
  // Small, uniform grace window to absorb ordinary network latency for the
  // "auto-submit exactly at zero" case — every participant gets the same
  // allowance, so it does not advantage anyone. It does NOT extend the
  // competition itself (the countdown/UI still target the real end_at).
  const GRACE_MS = 10_000;

  if (contest.status !== 'live' || now < startAt || now.getTime() > endAt.getTime() + GRACE_MS) {
    return jsonResponse(
      { error: 'This contest is not currently accepting submissions.' },
      409
    );
  }

  // 2. Verify the participant belongs to this contest.
  const { data: participant, error: participantError } = await admin
    .from('participants')
    .select('id, contest_id')
    .eq('id', participantId)
    .maybeSingle();

  if (participantError || !participant || participant.contest_id !== contestId) {
    return jsonResponse({ error: 'Participant not found for this contest' }, 404);
  }

  // 3. Reject if this participant has already submitted (defense in depth —
  //    the unique constraint on submissions.participant_id is the hard
  //    guarantee; this pre-check just gives a cleaner error message).
  const { data: existing } = await admin
    .from('submissions')
    .select('id')
    .eq('participant_id', participantId)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: 'A submission already exists for this participant.' }, 409);
  }

  // 4. Load the official questions for this contest (service role only —
  //    this table has no client-facing RLS policy at all).
  const { data: questions, error: questionsError } = await admin
    .from('contest_questions')
    .select('question_number, official_answer, official_keyword')
    .eq('contest_id', contestId)
    .order('question_number', { ascending: true });

  if (questionsError || !questions || questions.length !== QUESTION_COUNT) {
    return jsonResponse({ error: 'Contest questions are not configured correctly.' }, 500);
  }

  // 5. Score every answer server-side.
  const results = questions.map((q, i) => {
    const submittedAnswer = answers[i] ?? '';
    const correct = isCorrectAnswer(submittedAnswer, q.official_answer, q.official_keyword);
    return {
      question_number: q.question_number,
      answer: submittedAnswer,
      correct,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const wrongCount = QUESTION_COUNT - correctCount;

  // 6. Classify integrity from the client-reported counters (informational —
  //    never used to change the score, only to flag for admin review).
  const rawIntegrity = body.integrity ?? {};
  const counters = {
    pasteAttempts: clampCounter(rawIntegrity.pasteAttempts),
    copyAttempts: clampCounter(rawIntegrity.copyAttempts),
    cutAttempts: clampCounter(rawIntegrity.cutAttempts),
    dropAttempts: clampCounter(rawIntegrity.dropAttempts),
    tabSwitches: clampCounter(rawIntegrity.tabSwitches),
    visibilityChanges: clampCounter(rawIntegrity.visibilityChanges),
    fullscreenExits: clampCounter(rawIntegrity.fullscreenExits),
    refreshCount: clampCounter(rawIntegrity.refreshCount),
    multipleSubmitAttempts: clampCounter(rawIntegrity.multipleSubmitAttempts),
  };
  const integrityStatus = classifyIntegrity(counters);

  const durationSeconds =
    typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds)
      ? Math.max(0, Math.floor(body.durationSeconds))
      : null;

  const startedAt = typeof body.startedAt === 'string' ? body.startedAt : null;

  // 7. Insert. submitted_at is NOT supplied — the database default (now())
  //    is the authoritative server timestamp. The unique constraint on
  //    participant_id is the final guarantee against double submission,
  //    even under a race condition.
  const insertPayload: Record<string, unknown> = {
    contest_id: contestId,
    participant_id: participantId,
    results,
    correct_count: correctCount,
    wrong_count: wrongCount,
    score: correctCount,
    started_at: startedAt,
    duration_seconds: durationSeconds,
    paste_attempts: counters.pasteAttempts,
    copy_attempts: counters.copyAttempts,
    cut_attempts: counters.cutAttempts,
    drop_attempts: counters.dropAttempts,
    tab_switches: counters.tabSwitches,
    visibility_changes: counters.visibilityChanges,
    fullscreen_exits: counters.fullscreenExits,
    refresh_count: counters.refreshCount,
    multiple_submit_attempts: counters.multipleSubmitAttempts,
    integrity_status: integrityStatus,
  };
  results.forEach((r) => {
    insertPayload[`answer_${r.question_number}`] = r.answer;
  });

  const { data: inserted, error: insertError } = await admin
    .from('submissions')
    .insert(insertPayload)
    .select('id, submitted_at')
    .single();

  if (insertError) {
    // Postgres unique_violation — someone else's request won the race.
    if ((insertError as { code?: string }).code === '23505') {
      return jsonResponse({ error: 'A submission already exists for this participant.' }, 409);
    }
    console.error('submit-answers insert error', insertError);
    return jsonResponse({ error: 'Could not record submission. Please try again.' }, 500);
  }

  return jsonResponse({
    submissionId: inserted.id,
    submittedAt: inserted.submitted_at,
    correctCount,
    wrongCount,
    score: correctCount,
    total: QUESTION_COUNT,
    results, // safe: contains only the participant's own answers + correctness, never the official key
  });
});
