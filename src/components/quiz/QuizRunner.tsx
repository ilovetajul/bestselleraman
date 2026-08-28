import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import type { AttemptRecord, MatchResult, Question } from '../../types';
import { getPrincipleById } from '../../data/principles';
import { evaluateAnswer } from '../../lib/answerMatching';
import { buildHint } from '../../lib/hints';
import { generateQuestion } from '../../lib/quizEngine';
import { speak } from '../../lib/speech';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TeacherBubble } from './TeacherBubble';
import { SpeechControls } from './SpeechControls';
import { playSound } from '../../lib/sound';

const TYPE_LABEL: Record<Question['type'], string> = {
  'keyword-to-english': 'Keyword → English',
  'english-to-bangla': 'English → Bangla',
  'fill-blank': 'Fill In The Blank',
  'multiple-choice': 'Multiple Choice',
  'full-sentence-recall': 'Full Sentence Recall',
};

interface SessionSummary {
  total: number;
  correct: number;
  almost: number;
  incorrect: number;
}

interface QuizRunnerProps {
  initialQuestions: Question[];
  mode: AttemptRecord['mode'];
  onComplete: (summary: SessionSummary) => void;
  allowHints?: boolean;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  initialQuestions,
  mode,
  onComplete,
  allowHints = true,
}) => {
  const { settings, recordAnswer } = useApp();
  const [queue, setQueue] = useState<Question[]>(initialQuestions);
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [feedback, setFeedback] = useState<{ result: MatchResult; question: Question } | null>(
    null
  );
  const [summary, setSummary] = useState<SessionSummary>({
    total: 0,
    correct: 0,
    almost: 0,
    incorrect: 0,
  });
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const current = queue[index];
  const principle = current ? getPrincipleById(current.principleId) : undefined;
  const originalTotal = initialQuestions.length;

  const progressPct = useMemo(() => {
    if (originalTotal === 0) return 0;
    return Math.min(100, (summary.total / originalTotal) * 100);
  }, [summary.total, originalTotal]);

  if (!current || !principle) {
    return null;
  }

  const submitAnswer = (rawAnswer: string) => {
    if (feedback) return; // already answered, waiting for "next"
    let result = evaluateAnswer(rawAnswer, current.correctAnswer, settings.strictMatching);
    // Using the 3rd hint (full reveal) means the answer was given away —
    // cap credit so mastery isn't inflated by a revealed answer.
    if (hintLevel >= 3 && result === 'correct') result = 'almost';

    const { newBadges: earned } = recordAnswer(current.principleId, current.type, result, {
      mode,
    });
    if (earned.length) setNewBadges((prev) => [...prev, ...earned]);

    playSound(result, settings.soundEffects);

    setFeedback({ result, question: current });
    setSummary((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (result === 'correct' ? 1 : 0),
      almost: prev.almost + (result === 'almost' ? 1 : 0),
      incorrect: prev.incorrect + (result === 'incorrect' ? 1 : 0),
    }));

    if (result !== 'correct') {
      // Review again in the same session: requeue a fresh question a few slots ahead.
      setQueue((prevQueue) => {
        const insertAt = Math.min(prevQueue.length, index + 4);
        const requeued = generateQuestion(principle, current.type);
        const next = [...prevQueue];
        next.splice(insertAt, 0, requeued);
        return next;
      });
    }

    if (settings.autoNext) {
      const delay = result === 'correct' ? 1600 : 2800;
      window.setTimeout(() => advance(), delay);
    }
  };

  const advance = () => {
    setFeedback(null);
    setInputValue('');
    setHintLevel(0);
    if (index + 1 >= queue.length) {
      onComplete(summary);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleHint = () => {
    if (hintLevel >= 3) return;
    setHintLevel((h) => (h + 1) as 1 | 2 | 3);
  };

  const isMultipleChoice = current.type === 'multiple-choice';
  const promptLangClass = current.promptLang === 'bn' ? 'lang-bn' : '';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-ink/55 dark:text-white/55">
          Progress: {Math.min(summary.total + 1, originalTotal)} / {originalTotal}
        </p>
        {newBadges.length > 0 && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">
            🏅 {newBadges[newBadges.length - 1]}
          </p>
        )}
      </div>
      <div className="w-full h-1.5 bg-primary-50 dark:bg-white/10 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-primary-500 rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <Card className="p-6 sm:p-8 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300 mb-4">
              {TYPE_LABEL[current.type]}
            </p>

            <p className={`font-display text-2xl sm:text-3xl font-semibold mb-1 ${promptLangClass}`}>
              {current.type === 'fill-blank' ? current.blankTemplate : current.prompt}
            </p>
            {current.type === 'fill-blank' && (
              <p className="lang-bn text-ink/50 dark:text-white/50 mt-1">{current.prompt}</p>
            )}

            {isMultipleChoice && current.choices ? (
              <div className="grid grid-cols-1 gap-2.5 mt-6">
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    disabled={!!feedback}
                    onClick={() => {
                      setInputValue(choice);
                      submitAnswer(choice);
                    }}
                    className="text-left px-4 py-3 rounded-xl border border-black/10 dark:border-white/15 hover:border-primary-400 hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors font-medium disabled:opacity-60"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer(inputValue);
                }}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your answer…"
                  disabled={!!feedback}
                  autoComplete="off"
                  aria-label="Your answer"
                  className={`w-full px-4 py-3 rounded-xl border bg-transparent outline-none transition-colors disabled:opacity-70 ${
                    feedback?.result === 'incorrect'
                      ? 'border-rose-400 animate-shake'
                      : 'border-black/15 dark:border-white/20 focus:border-primary-500'
                  }`}
                />

                {allowHints && hintLevel !== 0 && !feedback && (
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Hint: {buildHint(current.correctAnswer, hintLevel)}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  <Button type="submit" disabled={!!feedback}>
                    Check Answer
                  </Button>
                  {allowHints && (
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<Lightbulb size={15} />}
                      disabled={!!feedback || hintLevel >= 3}
                      onClick={handleHint}
                    >
                      Need a Hint
                    </Button>
                  )}
                  <SpeechControls
                    onTranscript={(t) => setInputValue(t)}
                    speakText={current.correctAnswer}
                    speakLang={current.promptLang === 'bn' ? 'en-US' : 'bn-BD'}
                  />
                </div>
              </form>
            )}
          </Card>

          <AnimatePresence>
            {feedback && (
              <div className="mb-5">
                <TeacherBubble
                  result={feedback.result}
                  headline={
                    feedback.result === 'correct'
                      ? '✅ Correct!'
                      : feedback.result === 'almost'
                        ? '🟡 Almost correct!'
                        : '❌ Not quite — let’s recall that once more.'
                  }
                  userAnswer={feedback.result !== 'correct' ? inputValue : undefined}
                  correctAnswer={feedback.result !== 'correct' ? current.correctAnswer : undefined}
                  detail={
                    feedback.result === 'correct'
                      ? `${principle.keyword} = ${principle.banglaKeyword}`
                      : undefined
                  }
                  fullSentence={feedback.result === 'correct' ? principle.english : undefined}
                  pronunciation={settings.pronunciation ? principle.pronunciation : undefined}
                  memoryTip={feedback.result !== 'correct' ? principle.memoryTip : undefined}
                  onListen={() => speak(principle.english, 'en-US')}
                />
                {!settings.autoNext && (
                  <div className="flex justify-end mt-3">
                    <Button onClick={advance} icon={<ArrowRight size={16} />}>
                      Next Question
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
