import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

const NOT_CONFIGURED =
  'החיבור ל-Supabase לא הוגדר. יש להגדיר VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY כדי ליצור תוכן חדש. הספרייה המקומית ממשיכה לעבוד.';

/**
 * Offline stand-in used when the Supabase keys are missing, so the app still
 * loads and the local library keeps working instead of crashing on import.
 * Every call resolves to the same error, which callers already handle.
 */
function offlineClient(): SupabaseClient {
  const result = { data: null, error: { message: NOT_CONFIGURED, name: 'SupabaseNotConfigured' } };

  const query: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: () => query,
    finally: (fn: () => void) => Promise.resolve(result).finally(fn),
  };
  for (const method of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'limit', 'single']) {
    query[method] = () => query;
  }

  return {
    from: () => query,
    functions: { invoke: () => Promise.resolve(result) },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : offlineClient();
