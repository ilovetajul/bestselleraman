import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Zap, RotateCcw, ArrowRight } from 'lucide-react';
import type { Page } from '../types';
import { PRINCIPLE_GROUPS, getPrincipleById } from '../data/principles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

const GROUP_ACCENTS = ['bg-primary-500', 'bg-amber-500', 'bg-rose-500'];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { progress } = useApp();
  const overallMastery = Math.round(
    Object.values(progress.srs).reduce((sum, s) => sum + s.masteryScore, 0) /
      Math.max(1, Object.values(progress.srs).length)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl mx-auto"
      >
        <span className="inline-block text-xs font-semibold tracking-wide uppercase text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 px-3 py-1 rounded-full mb-5">
          BESTSELLER Founding Principles
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
          <span className="block">Master The</span>
          <span className="block text-primary-600 dark:text-primary-300">10 Principles</span>
          <span className="block">
            of <span className="text-primary-600 dark:text-primary-300">BESTSELLER</span>
          </span>
        </h1>
        <p className="mt-4 text-lg text-ink/60 dark:text-white/60">
          Learn fast. Recall effortlessly. Live the values every day.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" icon={<GraduationCap size={18} />} onClick={() => onNavigate('practice')}>
            Start Practice
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={<Zap size={18} />}
            onClick={() => onNavigate('challenge')}
          >
            120-Second Challenge
          </Button>
          <Button
            size="lg"
            variant="ghost"
            icon={<RotateCcw size={18} />}
            onClick={() => onNavigate('review')}
          >
            Review Mistakes
          </Button>
        </div>

        {overallMastery > 0 && (
          <p className="mt-6 text-sm text-ink/50 dark:text-white/50">
            You're at <span className="font-semibold text-primary-600 dark:text-primary-300">{overallMastery}%</span> overall mastery — keep going.
          </p>
        )}

        <p className="mt-3 text-xs font-medium tracking-wide text-ink/40 dark:text-white/35">
          10 Founding Principles • Active Recall • Daily Practice
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-5 mt-14">
        {PRINCIPLE_GROUPS.map((group, i) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
          >
            <Card className="p-5 h-full flex flex-col">
              <div className={`w-8 h-8 rounded-lg ${GROUP_ACCENTS[i]} text-white flex items-center justify-center text-sm font-display font-semibold mb-3`}>
                {group.id}
              </div>
              <p className="lang-bn text-lg font-semibold mb-0.5">{group.titleBangla}</p>
              <p className="text-sm text-ink/50 dark:text-white/50 mb-3">{group.titleEnglish}</p>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {group.principleIds.map((id) => {
                  const p = getPrincipleById(id);
                  if (!p) return null;
                  return (
                    <span
                      key={id}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-ink/70 dark:text-white/70"
                    >
                      {p.keyword}
                    </span>
                  );
                })}
              </div>
              <p className="lang-bn text-sm text-primary-600 dark:text-primary-300 mt-4 pt-3 border-t border-black/5 dark:border-white/10">
                {group.memoryPhrase}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => onNavigate('dashboard')}
        className="mt-12 mx-auto flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-300 hover:underline"
      >
        View your full dashboard <ArrowRight size={15} />
      </button>
    </div>
  );
};
