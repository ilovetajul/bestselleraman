import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import type { Page, Question } from '../types';
import { PRINCIPLES } from '../data/principles';
import { isDue } from '../lib/srs';
import { generateSessionQuestions } from '../lib/quizEngine';
import { useApp } from '../context/AppContext';
import { QuizRunner } from '../components/quiz/QuizRunner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

interface ReviewProps {
  onNavigate: (page: Page) => void;
}

type Stage = 'setup' | 'running' | 'summary';

export const Review: React.FC<ReviewProps> = ({ onNavigate }) => {
  const { progress } = useApp();
  const [stage, setStage] = useState<Stage>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [summary, setSummary] = useState({ total: 0, correct: 0, almost: 0, incorrect: 0 });

  const reviewPrinciples = useMemo(() => {
    const due = PRINCIPLES.filter((p) => isDue(progress.srs[p.id]) || (progress.srs[p.id]?.masteryScore ?? 0) < 60);
    if (due.length > 0) return due;
    // Nothing due — fall back to the 3 weakest so review is never empty.
    return [...PRINCIPLES]
      .sort((a, b) => (progress.srs[a.id]?.masteryScore ?? 0) - (progress.srs[b.id]?.masteryScore ?? 0))
      .slice(0, 3);
  }, [progress.srs]);

  const start = () => {
    setQuestions(generateSessionQuestions(reviewPrinciples, 'mixed'));
    setStage('running');
  };

  if (stage === 'running') {
    return (
      <QuizRunner
        initialQuestions={questions}
        mode="review"
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
        <Card className="p-8">
          <p className="text-5xl mb-2">✅</p>
          <h2 className="font-display text-2xl font-semibold mb-1">Review Complete</h2>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">Nice work tightening up the weak spots.</p>
          <ProgressBar value={accuracy} label="Accuracy" height="h-2.5" />
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button fullWidth icon={<RotateCcw size={16} />} onClick={() => setStage('setup')}>
              Review Again
            </Button>
            <Button fullWidth variant="secondary" icon={<LayoutDashboard size={16} />} onClick={() => onNavigate('dashboard')}>
              View Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-14 text-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
            <RotateCcw size={20} />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-1">Review Mistakes</h1>
          <p className="text-sm text-ink/55 dark:text-white/55 mb-6">
            {reviewPrinciples.length} principle{reviewPrinciples.length === 1 ? '' : 's'} need attention right now.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mb-7">
            {reviewPrinciples.map((p) => (
              <span
                key={p.id}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-ink/70 dark:text-white/70"
              >
                {p.keyword}
              </span>
            ))}
          </div>
          <Button size="lg" fullWidth icon={<CheckCircle2 size={17} />} onClick={start}>
            Start Review
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};
