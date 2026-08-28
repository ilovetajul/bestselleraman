import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  colorClass?: string;
  trackClass?: string;
  height?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  colorClass = 'bg-primary-500',
  trackClass = 'bg-primary-50 dark:bg-white/10',
  height = 'h-2.5',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-medium text-ink/60 dark:text-white/60 mb-1.5">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className={`w-full ${height} ${trackClass} rounded-full overflow-hidden`}>
        <motion.div
          className={`${height} ${colorClass} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
