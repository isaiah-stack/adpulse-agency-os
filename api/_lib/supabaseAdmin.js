// Shared helpers for Vercel Functions. The leading underscore keeps this folder from
// being deployed as an endpoint.
import { createClient } from '@supabase/supabase-js';

/** Supabase client with the service-role key, or null when not configured. */
export function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Resolve the caller from their Supabase access token; returns the user only if they are an admin. */
export async function requireAdmin(db, req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await db.from('profiles').select('id, role').eq('id', data.user.id).maybeSingle();
  return profile?.role === 'admin' ? data.user : null;
}
