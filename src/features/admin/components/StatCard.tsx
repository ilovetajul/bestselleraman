import React from 'react';
import { Card } from '../../../components/ui/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, tone = 'text-primary-600 dark:text-primary-300' }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-1">
      <p className="text-xs text-ink/50 dark:text-white/50">{label}</p>
      {icon && <span className={tone}>{icon}</span>}
    </div>
    <p className="font-display text-2xl font-semibold">{value}</p>
  </Card>
);
