import { GeneratedDimensions } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';
import { hasImageKey, getPasscode } from '@/lib/settings';

// The fal.ai fallback is only needed when a personal image key is kept in this
// browser, so it is pulled in on demand.
const fal = () => import('@/lib/fal');

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

/**
 * Free, keyless renderer. The URL itself is the image: the first request draws
 * it, later ones are served from cache. A fixed seed per prompt keeps it stable.
 */
function pollinationsUrl(prompt: string): string {
  let seed = 0;
  for (const ch of prompt) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const params = new URLSearchParams({
    width: '1280',
    height: '720',
    seed: String(seed % 1000000),
    nologo: 'true',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 900))}?${params}`;
}

export function freeImages(exteriorPrompt: string, interiorPrompt: string) {
  return { exterior: pollinationsUrl(exteriorPrompt), interior: pollinationsUrl(interiorPrompt) };
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
      try {
        return await (await fal()).generateImagesWithFal(exteriorPrompt, interiorPrompt);
      } catch {
        // A rejected or empty personal key falls through to the free renderer.
      }
    }
    // No paid image key anywhere: the free renderer, so a magazine is never empty.
    return freeImages(exteriorPrompt, interiorPrompt);
  }
}
