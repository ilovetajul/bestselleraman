import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, LayoutDashboard } from 'lucide-react';
import type { Page, Question, QuizMode } from '../types';
import { PRINCIPLES } from '../data/principles';
import { generateSessionQuestions } from '../lib/quizEngine';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

const MODE_OPTIONS: { value: QuizMode; label: string }[] = [
  { value: 'mixed', label: 'Mixed Quiz' },
  { value: 'keyword-to-english', label: 'Keyword → English' },
  { value: 'english-to-bangla', label: 'English → Bangla' },
  { value: 'fill-blank', label: 'Fill In The Blank' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'full-sentence-recall', label: 'Full Sentence Recall' },
];

interface PracticeProps {
  onNavigate: (page: Page) => void;
}

type Stage = 'setup' | 'running' | 'summary';

export const Practice: React.FC<PracticeProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [stage, setStage] = useState<Stage>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [summary, setSummary] = useState({ total: 0, correct: 0, almost: 0, incorrect: 0 });

  const start = () => {
    setQuestions(generateSessionQuestions(PRINCIPLES, mode));
    setStage('running');
  };

  if (stage === 'running') {
    return (
      <QuizRunner
        initialQuestions={questions}
        mode="practice"
        onComplete={(s) => {
          setSummary(s);
          setStage('summary');
        }}
      />
    );
  }

  if (stage === 'summary') {
    const accuracy = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8">
            <p className="text-5xl mb-2">{accuracy >= 80 ? '🟢' : accuracy >= 50 ? '🟡' : '💪'}</p>
            <h2 className="font-display text-2xl font-semibold mb-1">Session Complete</h2>
            <p className="text-sm text-ink/55 dark:text-white/55 mb-6">
              You practiced {summary.total} question{summary.total === 1 ? '' : 's'} this round.
            </p>
            <ProgressBar value={accuracy} label="Accuracy" height="h-2.5" />
            <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
              <div>
                <p className="font-display text-xl font-semibold text-primary-600 dark:text-primary-300">
                  {summary.correct}
                </p>
                <p className="text-ink/50 dark:text-white/50">Correct</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-amber-500">{summary.almost}</p>
                <p className="text-ink/50 dark:text-white/50">Almost</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-rose-500">{summary.incorrect}</p>
                <p className="text-ink/50 dark:text-white/50">Missed</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button fullWidth icon={<RotateCcw size={16} />} onClick={() => setStage('setup')}>
                Practice Again
              </Button>
              <Button
                fullWidth
                variant="secondary"
                icon={<LayoutDashboard size={16} />}
                onClick={() => onNavigate('dashboard')}
              >
                View Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1">Practice</h1>
      <p className="text-sm text-ink/55 dark:text-white/55 mb-7">
        Choose a quiz style. Your teacher will guide you through all 10 principles.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-8">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
              mode === opt.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                : 'border-black/10 dark:border-white/15 text-ink/70 dark:text-white/70 hover:border-primary-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Button size="lg" fullWidth onClick={start}>
        Start Practice
      </Button>
    </div>
  );
};
