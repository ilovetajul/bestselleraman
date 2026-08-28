import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { MatchResult } from '../../types';

interface TeacherBubbleProps {
  result: MatchResult | 'info';
  headline: string;
  userAnswer?: string;
  correctAnswer?: string;
  detail?: string; // e.g. "Honest = সৎ"
  fullSentence?: string;
  pronunciation?: string;
  memoryTip?: string;
  onListen?: () => void;
  showPronunciation?: boolean;
}

const toneStyles: Record<string, { ring: string; badgeBg: string; badgeText: string }> = {
  correct: {
    ring: 'ring-primary-200 dark:ring-primary-500/30',
    badgeBg: 'bg-primary-600',
    badgeText: 'text-white',
  },
  almost: {
    ring: 'ring-amber-200 dark:ring-amber-500/30',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
  },
  incorrect: {
    ring: 'ring-rose-200 dark:ring-rose-500/30',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white',
  },
  info: {
    ring: 'ring-black/10 dark:ring-white/15',
    badgeBg: 'bg-ink/80 dark:bg-white/20',
    badgeText: 'text-white',
  },
};

export const TeacherBubble: React.FC<TeacherBubbleProps> = ({
  result,
  headline,
  userAnswer,
  correctAnswer,
  detail,
  fullSentence,
  pronunciation,
  memoryTip,
  onListen,
  showPronunciation = true,
}) => {
  const tone = toneStyles[result] ?? toneStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 items-start"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-display font-semibold shadow-soft">
        শ
      </div>
      <div
        className={`relative flex-1 bg-surface dark:bg-surface-dark rounded-2xl rounded-tl-sm ring-1 ${tone.ring} shadow-soft dark:shadow-softdark px-4 py-3.5`}
      >
        <span
          className={`inline-flex animate-stampIn items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${tone.badgeBg} ${tone.badgeText}`}
        >
          {headline}
        </span>

        {result !== 'correct' && userAnswer !== undefined && (
          <p className="text-sm text-ink/70 dark:text-white/70 mb-1">
            You wrote: <span className="font-semibold text-rose-600 dark:text-rose-300">{userAnswer || '(blank)'}</span>
          </p>
        )}

        {correctAnswer && (
          <p className="text-sm text-ink/80 dark:text-white/80 mb-1">
            Correct answer: <span className="font-semibold text-primary-700 dark:text-primary-300">{correctAnswer}</span>
          </p>
        )}

        {detail && <p className="text-sm font-medium mb-1">{detail}</p>}

        {fullSentence && (
          <p className="font-display text-base font-medium mt-1.5">{fullSentence}</p>
        )}

        {showPronunciation && pronunciation && (
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-ink/55 dark:text-white/55">
            <span className="lang-bn">{pronunciation}</span>
            {onListen && (
              <button
                onClick={onListen}
                aria-label="Listen to pronunciation"
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-primary-600 dark:text-primary-300"
              >
                <Volume2 size={15} />
              </button>
            )}
          </div>
        )}

        {memoryTip && (
          <p className="text-sm mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-amber-700 dark:text-amber-300">
            💡 Memory tip: {memoryTip}
          </p>
        )}
      </div>
    </motion.div>
  );
};
