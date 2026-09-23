import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { GeneratedDimensions } from '@/types/article';
import { hasAnthropicKey, hasImageKey } from '@/lib/settings';

// The Anthropic SDK is a large dependency and is only needed once the user
// actually generates something, so it is pulled in on demand.
const claude = () => import('@/lib/claude');

function extractErrorMessage(error: unknown, fallbackMessage: string) {
  const rawMessage = typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '');

  const jsonMatch = rawMessage.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed?.error === 'string' && parsed.error.trim()) {
        return parsed.error;
      }
    } catch {
      // Ignore parse failures and fall back to the raw error message.
    }
  }

  return rawMessage || fallbackMessage;
}

/** True when text generation can run at all — either provider is enough. */
export function canGenerate(): boolean {
  return hasAnthropicKey() || isSupabaseConfigured;
}

/** True when the article can also get its two images. */
export function canGenerateImages(): boolean {
  return hasImageKey() || isSupabaseConfigured;
}

export async function generateDimensions(concept: string, hint?: string): Promise<GeneratedDimensions> {
  // A key the user pasted wins: it works without any backend deployed.
  if (hasAnthropicKey()) {
    return (await claude()).generateDimensionsWithClaude(concept, hint);
  }

  const { data, error } = await supabase.functions.invoke('generate-dimensions', {
    body: { concept, hint },
  });
  if (error) {
    throw new Error(extractErrorMessage(error, 'שגיאה ביצירת התוכן'));
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as GeneratedDimensions;
}

export async function generateImages(
  exteriorPrompt: string,
  interiorPrompt: string
): Promise<{ exterior: string; interior: string }> {
  if (hasImageKey()) {
    return (await claude()).generateImagesWithFal(exteriorPrompt, interiorPrompt);
  }

  const { data, error } = await supabase.functions.invoke('generate-images', {
    body: { exteriorPrompt, interiorPrompt },
  });
  if (error) {
    throw new Error(extractErrorMessage(error, 'שגיאה ביצירת התמונות'));
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as { exterior: string; interior: string };
}
