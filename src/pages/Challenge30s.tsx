import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Check, RotateCcw, LayoutDashboard } from 'lucide-react';
import type { Page } from '../types';
import { PRINCIPLES } from '../data/principles';
import { evaluateAnswer } from '../lib/answerMatching';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface ChallengeProps {
  onNavigate: (page: Page) => void;
}

type Stage = 'setup' | 'running' | 'summary';
const DURATION = 120;

export const Challenge30s: React.FC<ChallengeProps> = ({ onNavigate }) => {
  const { settings, recordAnswer, recordSpeedScore } = useApp();
  const [stage, setStage] = useState<Stage>('setup');
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [finalScore, setFinalScore] = useState<{ matched: number[]; missed: number[]; timeUsed: number } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (stage !== 'running') return;
    if (secondsLeft <= 0) {
      finish();
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  useEffect(() => {
    if (stage === 'running') inputRef.current?.focus();
  }, [stage]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const missed = PRINCIPLES.filter((p) => !matched.has(p.id)).map((p) => p.id);
    setFinalScore({ matched: Array.from(matched), missed, timeUsed: DURATION - secondsLeft });
    matched.forEach((id) => recordAnswer(id, 'full-sentence-recall', 'correct', { mode: 'speed' }));
    recordSpeedScore(matched.size);
    setStage('summary');
  };

  const start = () => {
    finishedRef.current = false;
    setMatched(new Set());
    setSecondsLeft(DURATION);
    setInputValue('');
    setFinalScore(null);
    setStage('running');
  };

  const handleChange = (val: string) => {
    setInputValue(val);
    for (const p of PRINCIPLES) {
      if (matched.has(p.id)) continue;
      const result = evaluateAnswer(val, p.keyword, settings.strictMatching);
      const resultSentence = evaluateAnswer(val, p.english, settings.strictMatching);
      if (result === 'correct' || resultSentence === 'correct') {
        setMatched((prev) => {
          const next = new Set(prev);
          next.add(p.id);
          if (next.size === PRINCIPLES.length) window.setTimeout(finish, 300);
          return next;
        });
        setInputValue('');
        return;
      }
    }
  };

  if (stage === 'summary' && finalScore) {
    const mastery = Math.round((finalScore.matched.length / PRINCIPLES.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14">
        <Card className="p-8 text-center">
          <p className="text-5xl mb-2">⚡</p>
          <h2 className="font-display text-2xl font-semibold mb-1">
            Score: {finalScore.matched.length} / {PRINCIPLES.length}
          </h2>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">
            Time used: {finalScore.timeUsed}s · Mastery: {mastery}%
          </p>

          <div className="grid grid-cols-2 gap-5 text-left">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-300 mb-2">Correct</p>
              <ul className="space-y-1 text-sm">
                {finalScore.matched.map((id) => (
                  <li key={id} className="flex items-center gap-1.5 text-ink/80 dark:text-white/80">
                    <Check size={13} className="text-primary-500 shrink-0" />
                    {PRINCIPLES.find((p) => p.id === id)?.keyword}
                  </li>
                ))}
                {finalScore.matched.length === 0 && <li className="text-ink/40">None yet</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-rose-500 mb-2">Missed</p>
              <ul className="space-y-1 text-sm">
                {finalScore.missed.map((id) => (
                  <li key={id} className="text-ink/60 dark:text-white/60">
                    {PRINCIPLES.find((p) => p.id === id)?.keyword}
                  </li>
                ))}
                {finalScore.missed.length === 0 && <li className="text-ink/40">None — perfect!</li>}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button fullWidth icon={<RotateCcw size={16} />} onClick={start}>
              Try Again
            </Button>
            <Button fullWidth variant="secondary" icon={<LayoutDashboard size={16} />} onClick={() => onNavigate('dashboard')}>
              View Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (stage === 'running') {
    const pct = (secondsLeft / DURATION) * 100;
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-semibold">120-Second Recall Challenge</h1>
          <motion.span
            key={secondsLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`font-display text-2xl font-bold tabular-nums ${secondsLeft <= 10 ? 'text-rose-500' : 'text-primary-600 dark:text-primary-300'}`}
          >
            {secondsLeft}s
          </motion.span>
        </div>
        <div className="w-full h-1.5 bg-primary-50 dark:bg-white/10 rounded-full overflow-hidden mb-7">
          <motion.div
            className={`h-full rounded-full ${secondsLeft <= 10 ? 'bg-rose-500' : 'bg-primary-500'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type as many principles as you can recall…"
          autoComplete="off"
          className="w-full px-4 py-3 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500 mb-7"
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRINCIPLES.map((p) => {
            const done = matched.has(p.id);
            return (
              <motion.div
                key={p.id}
                animate={done ? { scale: [1, 1.08, 1] } : {}}
                className={`rounded-xl px-3 py-3 text-center text-xs font-semibold border transition-colors ${
                  done
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-dashed border-black/15 dark:border-white/20 text-ink/30 dark:text-white/25'
                }`}
              >
                {done ? p.keyword : `#${p.id}`}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-7 text-center">
          <Button variant="ghost" onClick={finish}>
            End Early
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
      <Card className="p-8">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
          <Zap size={20} />
        </div>
        <h1 className="font-display text-2xl font-semibold mb-1">120-Second Recall Challenge</h1>
        <p className="text-sm text-ink/55 dark:text-white/55 mb-7">
          Say or type all 10 principles from memory before time runs out.
        </p>
        <Button size="lg" fullWidth onClick={start}>
          Start Challenge
        </Button>
      </Card>
    </div>
  );
};
