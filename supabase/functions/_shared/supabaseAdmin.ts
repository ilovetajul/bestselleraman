// Service-role Supabase client for use INSIDE Edge Functions only.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available as
// environment variables in every Supabase Edge Function's runtime — you do
// not set these yourself in most cases. Never send the service role key to
// the browser, and never import this file from frontend code.
import { createClient } from 'npm:@supabase/supabase-js@2';

export function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the function environment.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verifies the caller's JWT (sent as the Authorization header by the
 * frontend's authenticated Supabase client) belongs to a user listed in
 * admin_users. Returns the user id on success, or null if the caller is
 * not an authenticated admin.
 */
export async function requireAdmin(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const admin = getAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: adminRow, error: adminError } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow) return null;

  return { userId: userData.user.id };
}
