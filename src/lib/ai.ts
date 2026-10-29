import { GeneratedDimensions } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';
import { getPasscode } from '@/lib/settings';


function headers(): Record<string, string> {
  const passcode = getPasscode();
  return passcode ? { 'x-app-passcode': passcode } : {};
}

/**
 * Calls an Edge Function, where the provider key lives as a server secret.
 * Returns the parsed body, or throws with the function's own Hebrew message.
 */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body, headers: headers() });

  // A non-2xx reply carries our message in the body, which invoke() hides.
  if (error) {
    const response = (error as { context?: Response }).context;
    if (response instanceof Response) {
      try {
        const parsed = await response.clone().json();
        if (typeof parsed?.error === 'string' && parsed.error.trim()) {
          throw new Error(parsed.error);
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message && !(parseError instanceof SyntaxError)) {
          throw parseError;
        }
      }
    }
    throw new Error(error.message || 'השרת לא הגיב.');
  }

  if ((data as { error?: string })?.error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

/** Reports whether the server is reachable and its Gemini key is configured. */
export async function checkServer(): Promise<string> {
  await callFunction('generate-dimensions', { concept: '' }).catch((error: Error) => {
    // An empty concept is rejected by validation, which still proves the
    // function ran and found its key. Anything else is a real problem.
    if (/לא התקבל מושג/.test(error.message)) return;
    throw error;
  });
  return 'השרת מחובר והמפתח מוגדר בו.';
}

/** Text runs on the free Gemini key kept on the server; nothing to set up here. */
export async function generateDimensions(
  concept: string,
  hint?: string
): Promise<GeneratedDimensions> {
  return callFunction<GeneratedDimensions>('generate-dimensions', { concept, hint });
}
