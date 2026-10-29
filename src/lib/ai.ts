import { GeneratedDimensions } from '@/types/article';
import { supabase } from '@/integrations/supabase/client';
import { hasImageKey, getPasscode } from '@/lib/settings';
import { uploadMedia } from '@/lib/media';
import { Frame } from '@/types/article';

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

/**
 * Free, keyless renderer. A fixed seed per prompt keeps the picture stable.
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The free tier draws about one image per 45 seconds per visitor. Over that it
 * answers 402 with Retry-After, and a bare <img> pointed at the URL showed its
 * "Free limit reached" card inside the magazine. So the bytes are fetched here,
 * waiting when asked, and kept in our own bucket; a refusal is never stored.
 */
async function renderFree(prompt: string, articleId: string, frame: Frame): Promise<string | null> {
  const url = pollinationsUrl(prompt);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url);
      const type = response.headers.get('content-type') ?? '';
      if (response.ok && type.startsWith('image/')) {
        const blob = await response.blob();
        try {
          return await uploadMedia(new File([blob], `${frame}.jpg`, { type }), articleId, frame, 'image');
        } catch {
          // The image now exists in the renderer's cache, so its URL is safe.
          return url;
        }
      }
      if (response.status !== 402 && response.status !== 429 && response.status < 500) return null;
      const wait = Number(response.headers.get('retry-after')) || 20;
      await sleep(Math.min(wait, 60) * 1000 + 500);
    } catch {
      await sleep(5000);
    }
  }
  return null;
}

export type ArticleImages = { exterior: string | null; interior: string | null };

export async function generateImages(
  exteriorPrompt: string,
  interiorPrompt: string,
  articleId: string
): Promise<ArticleImages> {
  try {
    return await callFunction<ArticleImages>('generate-images', { exteriorPrompt, interiorPrompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (hasImageKey() && NOT_CONFIGURED.test(message)) {
      try {
        return await (await fal()).generateImagesWithFal(exteriorPrompt, interiorPrompt);
      } catch {
        // A rejected or empty personal key falls through to the free renderer.
      }
    }
    // No paid image key anywhere: the free renderer, one image after the other.
    const exterior = await renderFree(exteriorPrompt, articleId, 'exterior');
    const interior = await renderFree(interiorPrompt, articleId, 'interior');
    return { exterior, interior };
  }
}
