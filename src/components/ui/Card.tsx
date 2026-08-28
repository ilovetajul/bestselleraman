import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section';
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export const Card: React.FC<CardProps> = ({ children, className = '', as = 'div', onClick }) => {
  const Comp = as;
  return (
    <Comp
      className={`bg-surface dark:bg-surface-dark rounded-2xl shadow-soft dark:shadow-softdark border border-black/5 dark:border-white/5 ${className}`}
      onClick={onClick}
    >
      {children}
    </Comp>
  );
};
