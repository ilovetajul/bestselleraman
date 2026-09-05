import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, RotateCcw, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { isSpeechRecognitionSupported, startListening, stopListening } from '../../../lib/speech';
import type { ContestPrompt } from '../../../types/competition';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface VoiceAnswerFlowProps {
  prompts: ContestPrompt[];
  answers: string[];
  onAnswersChange: (answers: string[]) => void;
  disabled?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone permission was denied. Please allow microphone access and try again.',
  'no-speech': "Didn't catch that — please try speaking again.",
  'audio-capture': 'No microphone was found on this device.',
  network: 'A network error interrupted voice recognition. Please try again.',
};

export const VoiceAnswerFlow: React.FC<VoiceAnswerFlowProps> = ({
  prompts,
  answers,
  onAnswersChange,
  disabled,
}) => {
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const micSupported = isSpeechRecognitionSupported();
  const total = prompts.length;
  const current = prompts[index];

  const setAnswerAt = (i: number, value: string) => {
    const next = [...answers];
    next[i] = value;
    onAnswersChange(next);
  };

  const handleSpeak = () => {
    if (disabled || listening) return;
    setMicError(null);
    const started = startListening(
      (transcript) => {
        setAnswerAt(index, transcript.trim());
        setListening(false);
      },
      () => setListening(false),
      (errorCode) => {
        setListening(false);
        setMicError(
          (errorCode && ERROR_MESSAGES[errorCode]) || 'Voice recognition failed. Please try again.'
        );
      }
    );
    if (started) setListening(true);
    else setMicError('Voice recognition could not start on this device.');
  };

  const handleStop = () => {
    stopListening();
    setListening(false);
  };

  const goNext = () => {
    if (index + 1 >= total) {
      setReviewing(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const goToQuestion = (i: number) => {
    setReviewing(false);
    setIndex(i);
  };

  if (!micSupported) {
    return (
      <Card className="p-6 text-center">
        <MicOff size={22} className="mx-auto mb-3 text-rose-500" />
        <h2 className="font-display font-semibold mb-1.5">Voice input isn't supported here</h2>
        <p className="text-sm text-ink/55 dark:text-white/55">
          This competition requires voice answers, which need a browser with speech
          recognition support (Google Chrome works best). Please reopen this page in Chrome to
          take part.
        </p>
      </Card>
    );
  }

  if (reviewing) {
    const allAnswered = answers.every((a) => a && a.trim().length > 0);
    return (
      <div>
        <p className="text-center text-sm text-ink/55 dark:text-white/55 mb-4">
          Review your spoken answers. Tap any question to re-record it.
        </p>
        <div className="space-y-2.5 mb-6">
          {prompts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => goToQuestion(i)}
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-black/10 dark:border-white/15 hover:border-primary-400 transition-colors disabled:opacity-60"
            >
              <span className="w-6 h-6 shrink-0 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                {answers[i] ? (
                  <span className="font-medium truncate block">{answers[i]}</span>
                ) : (
                  <span className="italic text-rose-500">Not recorded yet — tap to speak</span>
                )}
              </span>
              <RotateCcw size={14} className="text-ink/40 dark:text-white/40 shrink-0" />
            </button>
          ))}
        </div>
        {!allAnswered && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-300 mb-3">
            You have unanswered questions above — you can still submit, but they'll be marked wrong.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-xs font-medium text-ink/50 dark:text-white/50 mb-4">
        Question {index + 1} of {total}
      </p>

      <Card className="p-6 text-center mb-4">
        <p className="lang-bn text-2xl font-semibold mb-6">{current?.prompt}</p>

        <AnimatePresence mode="wait">
          {answers[index] ? (
            <motion.div
              key="answered"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="font-display text-lg font-medium bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 rounded-xl px-4 py-3">
                “{answers[index]}”
              </p>
              <div className="flex gap-2.5 justify-center">
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={15} />}
                  disabled={disabled}
                  onClick={() => setAnswerAt(index, '')}
                >
                  Re-record
                </Button>
                <Button icon={<ArrowRight size={15} />} disabled={disabled} onClick={goNext}>
                  {index + 1 >= total ? 'Review Answers' : 'Next Question'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unanswered"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={listening ? handleStop : handleSpeak}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors disabled:opacity-50 ${
                  listening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
                aria-label={listening ? 'Stop listening' : 'Tap and speak'}
              >
                {listening ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <p className="text-sm font-medium mt-3 text-ink/60 dark:text-white/60">
                {listening ? 'Listening… speak now' : 'Tap and speak your answer'}
              </p>
              {micError && <p className="text-sm text-rose-600 dark:text-rose-300 mt-2">{micError}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={14} />}
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Check size={14} />}
          onClick={() => setReviewing(true)}
        >
          Review All
        </Button>
      </div>
    </div>
  );
};
