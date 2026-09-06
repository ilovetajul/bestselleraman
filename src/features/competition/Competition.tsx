import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Trophy, ShieldAlert, RotateCw } from 'lucide-react';
import { useContestSync } from './hooks/useContestSync';
import { useAntiCheat, trackRefreshCount } from './hooks/useAntiCheat';
import { CountdownTimer } from './components/CountdownTimer';
import { AnswerInput } from './components/AnswerInput';
import { VoiceAnswerFlow } from './components/VoiceAnswerFlow';
import { loadStoredParticipant, saveStoredParticipant, clearStoredParticipant } from './lib/storage';
import { callFunction, isSupabaseConfigured, supabase } from '../../lib/supabase';
import type {
  ContestPrompt,
  MyResultResponse,
  RegisterResponse,
  StoredParticipant,
  SubmitResponse,
} from '../../types/competition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type Stage =
  | 'loading'
  | 'not-configured'
  | 'closed'
  | 'register'
  | 'waiting'
  | 'live'
  | 'submitted'
  | 'results'
  | 'error';

const QUESTION_COUNT = 10;

const CompetitionInner: React.FC = () => {
  const [stage, setStage] = useState<Stage>('loading');
  // Keep polling while sitting on "submitted" so results appear
  // automatically once the admin publishes — without this, a participant
  // who stays on this screen would need to manually refresh to see them.
  const pollInterval = ['results', 'closed', 'error', 'not-configured'].includes(stage)
    ? null
    : 5000;
  const { contest, loading: contestLoading, error: contestError, serverNow } = useContestSync(
    undefined,
    pollInterval
  );

  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [fullNameInput, setFullNameInput] = useState('');
  const [idInput, setIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [prompts, setPrompts] = useState<ContestPrompt[]>([]);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTION_COUNT).fill(''));
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [myResult, setMyResult] = useState<MyResultResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const { getCounters, recordMultipleSubmitAttempt, setRefreshCount } = useAntiCheat(formRef);
  const liveStartedAtRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const bootstrappedContestId = useRef<string | null>(null);

  // ---- one-time bootstrap per contest: recover a cached registration, or
  //      send the participant to the registration form ----
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStage('not-configured');
      return;
    }
    if (contestLoading) return;
    if (contestError) {
      setStage('error');
      return;
    }
    if (!contest) {
      setStage('closed');
      return;
    }
    if (bootstrappedContestId.current === contest.id) return;
    bootstrappedContestId.current = contest.id;

    const cached = loadStoredParticipant(contest.id);
    if (!cached) {
      setStage(contest.status === 'draft' || contest.status === 'finished' ? 'closed' : 'register');
      return;
    }

    (async () => {
      try {
        const res = await callFunction<RegisterResponse>('register-participant', {
          contestId: contest.id,
          fullName: cached.fullName,
          participantIdentifier: cached.participantIdentifier,
        });
        const confirmed: StoredParticipant = {
          contestId: contest.id,
          participantId: res.participantId,
          fullName: res.fullName,
          participantIdentifier: cached.participantIdentifier,
        };
        setParticipant(confirmed);
        saveStoredParticipant(confirmed);

        if (res.alreadySubmitted) {
          setStage(contest.resultsPublished ? 'results' : 'submitted');
          if (contest.resultsPublished) await fetchMyResult(confirmed, contest.id);
        } else {
          setStage(contest.status === 'live' ? 'live' : 'waiting');
        }
      } catch {
        clearStoredParticipant(contest.id);
        setStage(contest.status === 'draft' || contest.status === 'finished' ? 'closed' : 'register');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest, contestLoading, contestError]);

  // ---- react to live status flips from the server ----
  useEffect(() => {
    if (!contest) return;
    if (stage === 'waiting' && contest.status === 'live') {
      setStage('live');
    }
    if (stage === 'live' && contest.status === 'finished') {
      doSubmit();
    }
    if (stage === 'submitted' && contest.resultsPublished && participant) {
      fetchMyResult(participant, contest.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest?.status, contest?.resultsPublished]);

  // ---- entering the live screen: load prompts + start tracking ----
  useEffect(() => {
    if (stage !== 'live' || !contest || !participant) return;
    liveStartedAtRef.current = serverNow().toISOString();
    setRefreshCount(trackRefreshCount(contest.id, participant.participantId));

    (async () => {
      const { data } = await supabase
        .from('contest_prompts')
        .select('id, contest_id, question_number, prompt')
        .eq('contest_id', contest.id)
        .order('question_number', { ascending: true });
      if (data) setPrompts(data as ContestPrompt[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function fetchMyResult(p: StoredParticipant, contestId: string) {
    try {
      const res = await callFunction<MyResultResponse>('get-my-result', {
        contestId,
        participantIdentifier: p.participantIdentifier,
        fullName: p.fullName,
      });
      setMyResult(res);
      setStage('results');
    } catch {
      // Results not available yet for some reason — leave them on "submitted".
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contest) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await callFunction<RegisterResponse>('register-participant', {
        contestId: contest.id,
        fullName: fullNameInput.trim(),
        participantIdentifier: idInput.trim(),
        phone: phoneInput.trim() || undefined,
        email: emailInput.trim() || undefined,
      });
      const confirmed: StoredParticipant = {
        contestId: contest.id,
        participantId: res.participantId,
        fullName: res.fullName,
        participantIdentifier: idInput.trim(),
      };
      setParticipant(confirmed);
      saveStoredParticipant(confirmed);

      if (res.alreadySubmitted) {
        setStage(contest.resultsPublished ? 'results' : 'submitted');
        if (contest.resultsPublished) await fetchMyResult(confirmed, contest.id);
      } else {
        setStage(contest.status === 'live' ? 'live' : 'waiting');
      }
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  async function doSubmit() {
    if (submittingRef.current || submitResult || !contest || !participant) {
      if (submittingRef.current) recordMultipleSubmitAttempt();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const durationSeconds = liveStartedAtRef.current
        ? Math.round((serverNow().getTime() - new Date(liveStartedAtRef.current).getTime()) / 1000)
        : undefined;
      const res = await callFunction<SubmitResponse>('submit-answers', {
        contestId: contest.id,
        participantId: participant.participantId,
        answers,
        startedAt: liveStartedAtRef.current,
        durationSeconds,
        integrity: getCounters(),
      });
      setSubmitResult(res);
      setStage('submitted');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // ============================== RENDER ==============================

  if (stage === 'loading') {
    return <CenteredMessage icon={<RotateCw className="animate-spin" size={22} />} title="Loading competition…" />;
  }

  if (stage === 'not-configured') {
    return (
      <CenteredMessage
        icon={<ShieldAlert size={22} />}
        title="Competition mode isn't configured yet"
        description="This deployment is missing its Supabase connection. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy."
      />
    );
  }

  if (stage === 'error') {
    return (
      <CenteredMessage
        icon={<ShieldAlert size={22} />}
        title="Couldn't reach the competition server"
        description={contestError ?? 'Please check your connection and try again.'}
      />
    );
  }

  if (stage === 'closed') {
    return (
      <CenteredMessage
        icon={<Lock size={22} />}
        title="No competition is open right now"
        description="Check back closer to the scheduled start time."
      />
    );
  }

  if (stage === 'register' && contest) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300 mb-2">
            🏆 {contest.name}
          </p>
          <h1 className="font-display text-2xl font-semibold mb-1">Enter Competition</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">
            Register once with your name and ID to take part.
          </p>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">Full Name</label>
              <input
                required
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                Participant / Employee ID
              </label>
              <input
                required
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">
                Phone or Email <span className="opacity-60">(optional)</span>
              </label>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Phone"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500 mb-2"
                autoComplete="tel"
              />
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
                autoComplete="email"
              />
            </div>

            {registerError && <p className="text-sm text-rose-600 dark:text-rose-300">{registerError}</p>}

            <Button type="submit" size="lg" fullWidth disabled={registering}>
              {registering ? 'Entering…' : 'Enter Competition'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (stage === 'waiting' && contest) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
        <Card className="p-8">
          <p className="text-4xl mb-3">🏆</p>
          <h1 className="font-display text-xl font-semibold leading-snug mb-1">{contest.name}</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">Competition starts in</p>
          <CountdownTimer targetTime={new Date(contest.startAt)} serverNow={serverNow} size="xl" />
          <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
            <Lock size={14} /> Competition has not started yet
          </p>
          <p className="text-xs text-ink/40 dark:text-white/40 mt-5">
            This page updates automatically — no need to refresh.
          </p>
        </Card>
      </div>
    );
  }

  if (stage === 'live' && contest) {
    const isVoiceMode = contest.answerMode === 'voice';
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">
            🏆 BESTSELLER 10 Founding Principles
          </p>
          <p className="text-sm text-ink/55 dark:text-white/55 mt-1">
            {isVoiceMode ? 'Speak all 10 principles from memory.' : 'Type all 10 principles from memory.'}
          </p>
          <div className="mt-4">
            <p className="text-xs text-ink/45 dark:text-white/45 mb-1">Time Remaining</p>
            <CountdownTimer
              targetTime={new Date(contest.endAt)}
              serverNow={serverNow}
              onReachZero={doSubmit}
              size="xl"
            />
          </div>
        </div>

        <p className="text-xs text-center text-ink/40 dark:text-white/40 mb-5">
          {isVoiceMode
            ? 'Please speak your answers aloud. Keyboard typing is disabled for this competition.'
            : 'Please type your answers directly. Copy and paste is not allowed.'}
        </p>

        <div ref={formRef}>
          {isVoiceMode ? (
            <VoiceAnswerFlow
              prompts={prompts}
              answers={answers}
              onAnswersChange={setAnswers}
              disabled={submitting}
            />
          ) : (
            <div className="space-y-3">
              {Array.from({ length: QUESTION_COUNT }, (_, i) => (
                <AnswerInput
                  key={i}
                  index={i}
                  value={answers[i]}
                  onChange={(v) => handleAnswerChange(i, v)}
                  disabled={submitting}
                />
              ))}
            </div>
          )}
        </div>

        {!isVoiceMode && prompts.length > 0 && (
          <p className="text-xs text-center text-ink/35 dark:text-white/35 mt-3 lang-bn">
            {prompts.map((p) => p.prompt).join(' • ')}
          </p>
        )}

        {submitError && (
          <p className="text-sm text-rose-600 dark:text-rose-300 text-center mt-4">{submitError}</p>
        )}

        <Button
          size="lg"
          fullWidth
          className="mt-6"
          disabled={submitting}
          onClick={() => setConfirmOpen(true)}
        >
          SUBMIT MY ANSWERS
        </Button>

        <ConfirmDialog
          open={confirmOpen}
          title="Submit your answers?"
          description="You can submit only once. Are you sure you want to submit?"
          confirmLabel="Submit"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSubmit}
        />
      </div>
    );
  }

  if (stage === 'submitted' && submitResult) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
        <Card className="p-8">
          <p className="text-5xl mb-3">✅</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Submission Received</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">
            Your answers have been securely recorded.
          </p>
          <div className="text-left bg-black/[0.03] dark:bg-white/5 rounded-xl p-4 text-sm space-y-1">
            <p>
              <span className="text-ink/50 dark:text-white/50">Submission ID:</span> {submitResult.submissionId}
            </p>
            <p>
              <span className="text-ink/50 dark:text-white/50">Status:</span> Recorded
            </p>
          </div>
          <p className="text-xs text-ink/40 dark:text-white/40 mt-6">
            Results will appear here automatically once the organizer publishes them.
          </p>
        </Card>
      </div>
    );
  }

  if (stage === 'submitted') {
    // Recovered "already submitted" state without the fresh submitResult payload.
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
        <Card className="p-8">
          <p className="text-5xl mb-3">✅</p>
          <h1 className="font-display text-2xl font-semibold mb-1">Submission Received</h1>
          <p className="text-sm text-ink/55 dark:text-white/55">
            Your answers have already been securely recorded. Results will appear here automatically
            once the organizer publishes them.
          </p>
        </Card>
      </div>
    );
  }

  if (stage === 'results' && myResult) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-5xl mb-2">
            {myResult.correctCount === 10 ? '🏆' : myResult.correctCount >= 7 ? '🟢' : '💪'}
          </p>
          <h1 className="font-display text-2xl font-semibold mb-1">Competition Results</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">{myResult.contestName}</p>

          <p className="font-display text-4xl font-bold text-primary-600 dark:text-primary-300">
            {myResult.correctCount} / 10
          </p>
          <p className="text-sm text-ink/50 dark:text-white/50 mt-1">
            {myResult.correctCount} correct · {myResult.wrongCount} wrong
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6 text-sm text-left">
            <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl p-3">
              <p className="text-ink/50 dark:text-white/50 text-xs">Your Rank</p>
              <p className="font-display font-semibold text-lg">
                #{myResult.rank} <span className="text-xs font-normal text-ink/40">of {myResult.totalParticipants}</span>
              </p>
            </div>
            <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl p-3">
              <p className="text-ink/50 dark:text-white/50 text-xs">Submitted</p>
              <p className="font-display font-semibold text-lg">
                {new Date(myResult.submittedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          {myResult.topThree.length > 0 && (
            <div className="mt-7 pt-6 border-t border-black/5 dark:border-white/10">
              <p className="font-display font-semibold mb-3 flex items-center justify-center gap-1.5">
                <Trophy size={16} className="text-amber-500" /> Top Results
              </p>
              <div className="space-y-2">
                {myResult.topThree.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between text-sm bg-black/[0.03] dark:bg-white/5 rounded-lg px-3 py-2"
                  >
                    <span className="font-medium">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'} {entry.fullName}
                    </span>
                    <span className="text-ink/50 dark:text-white/50">{entry.score}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return <CenteredMessage icon={<RotateCw className="animate-spin" size={22} />} title="Loading…" />;
};

const CenteredMessage: React.FC<{ icon: React.ReactNode; title: string; description?: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 text-ink/60 dark:text-white/60">
        {icon}
      </div>
      <h1 className="font-display text-xl font-semibold mb-1">{title}</h1>
      {description && <p className="text-sm text-ink/55 dark:text-white/55">{description}</p>}
    </motion.div>
  </div>
);

export const Competition: React.FC = () => <CompetitionInner />;
