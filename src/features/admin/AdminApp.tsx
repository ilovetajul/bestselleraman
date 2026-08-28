import React, { useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminContestDetail } from './AdminContestDetail';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export const AdminApp: React.FC = () => {
  const { status, signOut } = useAdminAuth();
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <FullScreenMessage
        title="Admin isn't configured yet"
        description="This deployment is missing its Supabase connection. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy."
      />
    );
  }

  if (status === 'loading') {
    return <FullScreenMessage title="Loading…" />;
  }

  if (status === 'signed-out') {
    return <AdminLogin />;
  }

  if (status === 'not-admin') {
    return (
      <FullScreenMessage
        title="Access denied"
        description="This account is signed in but is not registered as an admin. Ask an existing admin to add your user id to the admin_users table."
        action={
          <Button variant="ghost" icon={<LogOut size={15} />} onClick={signOut}>
            Sign Out
          </Button>
        }
      />
    );
  }

  if (selectedContestId) {
    return (
      <AdminContestDetail contestId={selectedContestId} onBack={() => setSelectedContestId(null)} />
    );
  }

  return <AdminDashboard onOpenContest={setSelectedContestId} />;
};

const FullScreenMessage: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink-dark px-4">
    <div className="text-center max-w-sm">
      <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 text-ink/60 dark:text-white/60">
        <ShieldAlert size={20} />
      </div>
      <h1 className="font-display text-xl font-semibold mb-1">{title}</h1>
      {description && <p className="text-sm text-ink/55 dark:text-white/55 mb-4">{description}</p>}
      {action}
    </div>
  </div>
);
