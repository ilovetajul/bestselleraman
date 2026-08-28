import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AdminLogin: React.FC = () => {
  const { signIn, error } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink-dark px-4">
      <Card className="p-8 max-w-sm w-full">
        <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center text-white mb-4">
          <ShieldCheck size={20} />
        </div>
        <h1 className="font-display text-xl font-semibold mb-1">BESTSELLER Admin</h1>
        <p className="text-sm text-ink/55 dark:text-white/55 mb-6">Sign in to manage competitions.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink/60 dark:text-white/60 block mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/20 bg-transparent outline-none focus:border-primary-500"
            />
          </div>
          {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
