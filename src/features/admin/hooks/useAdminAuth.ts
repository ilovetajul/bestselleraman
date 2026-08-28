import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

type AuthStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin';

export function useAdminAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdmin = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setStatus('signed-out');
      return;
    }
    const { data, error: checkError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    if (checkError) {
      setStatus('not-admin');
      return;
    }
    setStatus(data ? 'admin' : 'not-admin');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('signed-out');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkAdmin(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkAdmin(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [checkAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { status, session, error, signIn, signOut };
}
