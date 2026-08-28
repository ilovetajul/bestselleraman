import React from 'react';

type Tone = 'primary' | 'amber' | 'rose' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  neutral: 'bg-black/5 text-ink/70 dark:bg-white/10 dark:text-white/70',
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${toneClasses[tone]} ${className}`}
  >
    {children}
  </span>
);
