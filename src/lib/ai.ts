import { supabase } from '@/integrations/supabase/client';
import { GeneratedDimensions } from '@/types/article';

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

export async function generateDimensions(concept: string, hint?: string): Promise<GeneratedDimensions> {
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
