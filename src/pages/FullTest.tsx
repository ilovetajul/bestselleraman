import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, LayoutDashboard } from 'lucide-react';
import type { Page } from '../types';
import { PRINCIPLES } from '../data/principles';
import { evaluateAnswer } from '../lib/answerMatching';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface FullTestProps {
  onNavigate: (page: Page) => void;
}

type Stage = 'setup' | 'running' | 'summary';

interface ResultRow {
  id: number;
  keyword: string;
  passed: boolean;
}

export const FullTest: React.FC<FullTestProps> = ({ onNavigate }) => {
  const { settings, recordAnswer } = useApp();
  const [stage, setStage] = useState<Stage>('setup');
  const [answers, setAnswers] = useState<string[]>(Array(PRINCIPLES.length).fill(''));
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const start = () => {
    setAnswers(Array(PRINCIPLES.length).fill(''));
    setResults(null);
    setStage('running');
  };

  const submit = () => {
    const rows: ResultRow[] = PRINCIPLES.map((p, i) => {
      const userAnswer = answers[i] ?? '';
      const byKeyword = evaluateAnswer(userAnswer, p.keyword, settings.strictMatching);
      const bySentence = evaluateAnswer(userAnswer, p.english, settings.strictMatching);
      const passed = byKeyword !== 'incorrect' || bySentence !== 'incorrect';
      recordAnswer(p.id, 'full-sentence-recall', passed ? 'correct' : 'incorrect', {
        mode: 'full-test',
      });
      return { id: p.id, keyword: p.keyword, passed };
    });
    setResults(rows);
    setStage('summary');
  };

  if (stage === 'summary' && results) {
    const score = results.filter((r) => r.passed).length;
    const perfect = score === PRINCIPLES.length;
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14">
        <Card className="p-8 text-center">
          <p className="text-5xl mb-2">{perfect ? '🏆' : score >= 7 ? '🟢' : '💪'}</p>
          <h2 className="font-display text-2xl font-semibold mb-6">
            Score: {score} / {PRINCIPLES.length}
          </h2>

          <div className="grid grid-cols-2 gap-5 text-left">
            <div>
              <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-300 mb-2">Correct</p>
              <ul className="space-y-1 text-sm">
                {results.filter((r) => r.passed).map((r) => (
                  <li key={r.id} className="text-ink/80 dark:text-white/80">
                    {r.keyword}
                  </li>
                ))}
                {results.every((r) => !r.passed) && <li className="text-ink/40">None yet</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-rose-500 mb-2">Needs Review</p>
              <ul className="space-y-1 text-sm">
                {results.filter((r) => !r.passed).map((r) => (
                  <li key={r.id} className="text-ink/60 dark:text-white/60">
                    {r.keyword}
                  </li>
                ))}
                {results.every((r) => r.passed) && <li className="text-ink/40">None — perfect!</li>}
              </ul>
            </div>
          </div>

          <p className="text-xs text-ink/45 dark:text-white/45 mt-6">
            Missed items have been scheduled for your next review session.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <Button fullWidth icon={<RotateCcw size={16} />} onClick={start}>
              Retake Test
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
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-xl font-semibold mb-1">Full 10-Principle Challenge</h1>
        <p className="text-sm text-ink/55 dark:text-white/55 mb-7">
          Recall all 10 principles in order. No hints this time — you've got this.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3"
        >
          {answers.map((val, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-7 h-7 shrink-0 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <input
                value={val}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder={`Principle #${i + 1}`}
                autoComplete="off"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
              />
            </div>
          ))}
          <Button type="submit" size="lg" fullWidth className="mt-2">
            Submit Test
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto mb-4">
            <Trophy size={20} />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-1">Full 10-Principle Challenge</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-7">
            An exam-style test — no hints, no visible list. Recall all 10 in order, from memory.
          </p>
          <Button size="lg" fullWidth onClick={start}>
            Begin Test
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};
