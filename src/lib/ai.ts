import { GeneratedDimensions } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';
import { hasAnthropicKey, hasImageKey, getPasscode } from '@/lib/settings';

// The Anthropic SDK is a large dependency and is only needed when a key is kept
// in this browser instead of on the server, so it is pulled in on demand.
const claude = () => import('@/lib/claude');

/** Marks the server saying its own provider key is missing, so we can fall back. */
const NOT_CONFIGURED = /לא הוגדר בשרת/;

function headers(): Record<string, string> {
  const passcode = getPasscode();
  return passcode ? { 'x-app-passcode': passcode } : {};
}

/**
 * Calls an Edge Function, where the provider key lives as a server secret.
 * Returns the parsed body, or throws with the function's own Hebrew message.
 */
async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
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

/**
 * Generation runs through the server, so nothing has to be configured in this
 * browser. A key saved here is only a personal override.
 */
export function canGenerate(): boolean {
  return true;
}

export function canGenerateImages(): boolean {
  return true;
}

/** True when this browser holds its own key rather than relying on the server. */
export function usesOwnKey(): boolean {
  return hasAnthropicKey();
}

export async function verifyKey(apiKey: string): Promise<string> {
  return (await claude()).verifyAnthropicKey(apiKey);
}

/** Reports whether the server is reachable and its Claude key is configured. */
export async function checkServer(): Promise<string> {
  await callFunction('generate-dimensions', { concept: '' }).catch((error: Error) => {
    // An empty concept is rejected by validation, which still proves the
    // function ran and found its key. Anything else is a real problem.
    if (/לא התקבל מושג/.test(error.message)) return;
    throw error;
  });
  return 'השרת מחובר והמפתח מוגדר בו.';
}

export async function generateDimensions(
  concept: string,
  hint?: string
): Promise<GeneratedDimensions> {
  try {
    return await callFunction<GeneratedDimensions>('generate-dimensions', { concept, hint });
  } catch (error) {
    // Only fall back to a key kept in this browser when the server has none.
    const message = error instanceof Error ? error.message : '';
    if (hasAnthropicKey() && NOT_CONFIGURED.test(message)) {
      return (await claude()).generateDimensionsWithClaude(concept, hint);
    }
    throw error;
  }
}

export async function generateImages(
  exteriorPrompt: string,
  interiorPrompt: string
): Promise<{ exterior: string; interior: string }> {
  try {
    return await callFunction<{ exterior: string; interior: string }>('generate-images', {
      exteriorPrompt,
      interiorPrompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (hasImageKey() && NOT_CONFIGURED.test(message)) {
      return (await claude()).generateImagesWithFal(exteriorPrompt, interiorPrompt);
    }
    throw error;
  }
}
