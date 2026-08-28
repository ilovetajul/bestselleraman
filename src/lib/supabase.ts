import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  // Do not throw — Practice mode must keep working even if Competition mode
    // has not been configured yet. Competition/Admin screens check
      // `isSupabaseConfigured` and show a clear setup message instead of a
        // crash.
          // eslint-disable-next-line no-console
            console.warn(
                '[Competition] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — Competition mode is disabled until these are configured.'
                  );
                  }

                  // A harmless placeholder URL/key lets createClient succeed even when unset,
                  // so importing this module never crashes the rest of the app; every actual
                  // call site should still gate on isSupabaseConfigured first.
                  export const supabase = createClient(
                    supabaseUrl || 'https://placeholder.supabase.co',
                      supabaseAnonKey || 'placeholder-anon-key',
                        {
                            auth: {
                                  persistSession: true,
                                        autoRefreshToken: true,
                                            },
                                              }
                                              );

                                              /**
                                               * Calls a Supabase Edge Function by name with a JSON body. Supabase's
                                                * gateway requires an apikey + Authorization header on every request
                                                 * (even "public" functions), or it rejects the request before it ever
                                                  * reaches our function code. We default both to the anon key, and swap
                                                   * Authorization for the signed-in user's own session token when
                                                    * `authed: true` is passed (required for admin-* functions, which check
                                                     * that token server-side against admin_users).
                                                      */
                                                      export async function callFunction<T>(
                                                        name: string,
                                                          body: Record<string, unknown> = {},
                                                            options: { authed?: boolean; method?: 'GET' | 'POST' } = {}
                                                            ): Promise<T> {
                                                              const { authed = false, method = 'POST' } = options;

                                                                const headers: Record<string, string> = {
                                                                    'Content-Type': 'application/json',
                                                                        apikey: supabaseAnonKey || '',
                                                                            Authorization: `Bearer ${supabaseAnonKey || ''}`,
                                                                              };

                                                                                if (authed) {
                                                                                    const { data } = await supabase.auth.getSession();
                                                                                        const token = data.session?.access_token;
                                                                                            if (!token) throw new Error('Not signed in.');
                                                                                                headers.Authorization = `Bearer ${token}`;
                                                                                                  }

                                                                                                    const url = new URL(`${supabaseUrl}/functions/v1/${name}`);
                                                                                                      const init: RequestInit = { method, headers };

                                                                                                        if (method === 'GET') {
                                                                                                            Object.entries(body).forEach(([key, value]) => {
                                                                                                                  if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
                                                                                                                      });
                                                                                                                        } else {
                                                                                                                            init.body = JSON.stringify(body);
                                                                                                                              }

                                                                                                                                const res = await fetch(url.toString(), init);
                                                                                                                                  const json = await res.json().catch(() => ({}));

                                                                                                                                    if (!res.ok) {
                                                                                                                                        throw new Error((json as { error?: string }).error || `Request to ${name} failed.`);
                                                                                                                                          }

                                                                                                                                            return json as T;
                                                                                                                                            }