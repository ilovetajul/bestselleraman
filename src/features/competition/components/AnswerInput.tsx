import React from 'react';

interface AnswerInputProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({ index, value, onChange, disabled }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 shrink-0 rounded-full bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={`Principle #${index + 1}`}
        aria-label={`Answer ${index + 1}`}
        className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500 disabled:opacity-60 select-text"
      />
    </div>
  );
};
