import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Invite and password-recovery links arrive as "#...&type=invite|recovery". Capture the
// type before supabase-js consumes and clears the URL hash, so the app can ask the user
// to choose a password.
export const initialAuthLinkType =
  typeof window !== 'undefined'
    ? (/[#&]type=(invite|recovery)\b/.exec(window.location.hash) || [])[1] || null
    : null;

// When env vars are absent the app runs in local mode (seeded state + localStorage).
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null;
