// POST /functions/v1/admin-create-contest
// Requires an admin session (Authorization: Bearer <supabase auth JWT>).
//
// Creates a contest and automatically seeds its 10 questions from the fixed
// BESTSELLER official answer key (supabase/functions/_shared/officialAnswers.ts).
// Admins configure timing only — the questions/answers are not user-editable
// through this endpoint by design, since they are the fixed, secret answer key.

import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getAdminClient, requireAdmin } from '../_shared/supabaseAdmin.ts';
import { OFFICIAL_QUESTIONS } from '../_shared/officialAnswers.ts';

interface CreateContestBody {
  name?: string;
  startAt?: string;
  endAt?: string;
  durationSeconds?: number;
  timezone?: string;
  requireContact?: boolean;
  initialStatus?: 'draft' | 'scheduled';
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

  let body: CreateContestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const timezone = typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone.trim() : 'Asia/Dhaka';
  const durationSeconds = typeof body.durationSeconds === 'number' ? Math.floor(body.durationSeconds) : 0;
  const requireContact = !!body.requireContact;
  const initialStatus = body.initialStatus === 'scheduled' ? 'scheduled' : 'draft';
  const answerMode = body.answerMode === 'voice' ? 'voice' : 'keyboard';

  const startAt = body.startAt ? new Date(body.startAt) : null;
  const endAt = body.endAt ? new Date(body.endAt) : null;

  if (!name) return jsonResponse({ error: 'Competition name is required.' }, 400);
  if (!startAt || Number.isNaN(startAt.getTime())) {
    return jsonResponse({ error: 'A valid start date/time is required.' }, 400);
  }
  if (!endAt || Number.isNaN(endAt.getTime())) {
    return jsonResponse({ error: 'A valid end date/time is required.' }, 400);
  }
  if (endAt <= startAt) {
    return jsonResponse({ error: 'End time must be after start time.' }, 400);
  }
  if (durationSeconds <= 0) {
    return jsonResponse({ error: 'Duration (in minutes) must be greater than zero.' }, 400);
  }

  const db = getAdminClient();

  const { data: contest, error: insertError } = await db
    .from('contests')
    .insert({
      name,
      timezone,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      duration_seconds: durationSeconds,
      require_contact: requireContact,
      answer_mode: answerMode,
      status: initialStatus,
    })
    .select('id')
    .single();

  if (insertError || !contest) {
    console.error('admin-create-contest insert error', insertError);
    return jsonResponse({ error: 'Could not create contest.' }, 500);
  }

  const questionRows = OFFICIAL_QUESTIONS.map((q) => ({
    contest_id: contest.id,
    question_number: q.questionNumber,
    prompt: q.prompt,
    official_answer: q.officialAnswer,
    official_keyword: q.officialKeyword,
  }));

  const { error: questionsError } = await db.from('contest_questions').insert(questionRows);

  if (questionsError) {
    console.error('admin-create-contest questions error', questionsError);
    // Roll back the contest row so we don't leave a question-less contest behind.
    await db.from('contests').delete().eq('id', contest.id);
    return jsonResponse({ error: 'Could not seed contest questions.' }, 500);
  }

  return jsonResponse({ contestId: contest.id });
});
