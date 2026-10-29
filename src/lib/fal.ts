import { getImageKey } from '@/lib/settings';

/**
 * Images are optional. This uses the same fal.ai model as the edge function,
 * with a key the user supplies separately in this browser.
 */
export async function generateImagesWithFal(
  exteriorPrompt: string,
  interiorPrompt: string
): Promise<{ exterior: string; interior: string }> {
  const key = getImageKey();
  if (!key) throw new Error('לא נשמר מפתח ליצירת תמונות.');

  const one = async (prompt: string): Promise<string> => {
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image_size: { width: 1280, height: 720 } }),
    });
    if (!res.ok) {
      throw new Error(
        res.status === 401 || res.status === 403
          ? 'מפתח התמונות נדחה.'
          : `שגיאה ביצירת תמונה (${res.status}).`
      );
    }
    const data = await res.json();
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error('שירות התמונות לא החזיר תמונה.');
    return url;
  };

  const [exterior, interior] = await Promise.all([one(exteriorPrompt), one(interiorPrompt)]);
  return { exterior, interior };
}
