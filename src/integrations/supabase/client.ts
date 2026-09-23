import { createClient } from '@supabase/supabase-js';

/**
 * Project connection. Both values are meant to be public: the publishable key
 * only grants what the table's row-level security policies allow, and it is
 * visible in any browser that loads the site.
 *
 * No secret is ever kept here. The Anthropic key lives in this project's Edge
 * Function secrets, server-side, where the browser cannot reach it.
 */
export const SUPABASE_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
