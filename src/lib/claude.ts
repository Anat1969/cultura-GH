import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { GeneratedDimensions, HUMAN_NEEDS } from '@/types/article';
import { getAnthropicKey, getImageKey } from '@/lib/settings';

const MODEL = 'claude-opus-5';

const IMAGE_STYLE =
  'Documentary realism, professional architecture photography, 16:9, natural light, no people in focus, no text, no words, no writing, no frame divisions';

const systemPrompt = `You are CultureArch — a cultural anthropologist and architect-psychologist who has travelled the world.
You translate a cultural concept into practical life tools and into a physical, healing space.
Work with the three-layer method: linguistic, contextual, psychological. Respect the source culture; do not flatten it and do not impose it.

Write every field in Hebrew, except origin.region_en and the two imagePrompts, which are in English.

Field guidance:
- origin.script: the word in its original script (間, Φιλοξενία, كرم). Latin letters if the language uses Latin script.
- origin.transliteration: Latin transliteration (Ma, Philoxenia, Karam).
- origin.literal: literal meaning in Hebrew, 2-6 words.
- origin.culture: culture or language name in Hebrew, short (יפן, דנמרק, יוון, ערבית, עברית).
- origin.region_en: country or region in English, specific enough to search (Japan; Denmark; Andalusia, Spain).
- insight: 3-5 sentences — where and when the concept arose, how it is used in the source culture (rituals, customs, architecture), what human need it answers, what it soothes and what it promotes. If the etymology or origin is disputed or uncertain, say so explicitly in one sentence.
- spaceName: a poetic Hebrew name for a space embodying the concept.
- proverb: ONE original line in Hebrew written in the spirit of the concept. Never present it as a real proverb of that culture.
- interpretation: 2-3 sentences — the natural bridge to Israeli or Jewish culture: a similar or complementary local concept, and what is unique in the foreign one.
- practice.why/how/when/where: one sentence each — the need it serves; a concrete daily practice; situations where it helps most; how to express it in physical space (material, light, texture, threshold).
- imagePrompts.exterior: detailed English prompt for the concept embodied in a real place in its region of origin (name the region). End with: '${IMAGE_STYLE}'
- imagePrompts.interior: detailed English prompt for a healing living space in Israel (name a landscape — Judean foothills, Galilee, Negev, Mediterranean coast) that translates the concept into material, light, texture and tension without imitating the source culture. End with: '${IMAGE_STYLE}'

Never invent sources, quotes or statistics. Be precise about the language of origin.`;

const DimensionsSchema = z.object({
  origin: z.object({
    script: z.string(),
    transliteration: z.string(),
    literal: z.string(),
    culture: z.string(),
    region_en: z.string(),
  }),
  insight: z.string(),
  spaceName: z.string(),
  proverb: z.string(),
  interpretation: z.string(),
  humanNeed: z.enum([...HUMAN_NEEDS] as [string, ...string[]]),
  practice: z.object({
    why: z.string(),
    how: z.string(),
    when: z.string(),
    where: z.string(),
  }),
  imagePrompts: z.object({
    exterior: z.string(),
    interior: z.string(),
  }),
});

function client(): Anthropic {
  const apiKey = getAnthropicKey();
  if (!apiKey) throw new Error('לא נשמר מפתח Claude. פתח "הגדרות" והדבק מפתח.');
  // The key belongs to the user and never leaves their browser except to
  // Anthropic, so direct browser calls are the intended setup here.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

function toFriendlyError(error: unknown): Error {
  if (error instanceof Anthropic.AuthenticationError) {
    return new Error('המפתח נדחה. ודא שהעתקת אותו במלואו ושהוא עדיין פעיל.');
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return new Error('אין הרשאה למפתח הזה. ייתכן שנגמר התקציב בחשבון.');
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new Error('יותר מדי בקשות בזמן קצר. המתן רגע ונסה שוב.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new Error('לא הצלחתי להגיע ל-Claude. בדוק את החיבור לאינטרנט.');
  }
  if (error instanceof Anthropic.APIError) {
    return new Error(`שגיאה מ-Claude (${error.status}): ${error.message}`);
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Confirms a key really works, using the models endpoint: it is authenticated
 * but costs nothing and generates nothing, so the answer is definitive without
 * spending anything.
 */
export async function verifyAnthropicKey(apiKey: string): Promise<string> {
  try {
    const probe = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    await probe.models.list();
    return MODEL;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function generateDimensionsWithClaude(
  concept: string,
  hint?: string
): Promise<GeneratedDimensions> {
  const userLine = `המושג התרבותי: ${concept}${hint?.trim() ? `
Hint: ${hint.trim()}` : ''}`;

  const base = {
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt,
    thinking: { type: 'adaptive' as const },
    output_config: { format: zodOutputFormat(DimensionsSchema) },
    messages: [{ role: 'user' as const, content: userLine }],
  };

  const c = client();

  try {
    let stopReason: string | null;
    let parsed: unknown;

    try {
      // A policy decline would leave the user with nothing on screen, so let the
      // API re-run the same request on another model rather than failing.
      const response = await c.beta.messages.parse({
        ...base,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
      stopReason = response.stop_reason;
      parsed = response.parsed_output;
    } catch (error) {
      // If this account or endpoint will not take the fallback beta, generating
      // at all matters more than the extra resilience — retry without it.
      if (!(error instanceof Anthropic.BadRequestError)) throw error;
      const response = await c.messages.parse(base);
      stopReason = response.stop_reason;
      parsed = response.parsed_output;
    }

    if (stopReason === 'refusal') {
      throw new Error('הבקשה נדחתה. נסה לנסח את המושג אחרת.');
    }
    if (!parsed) {
      throw new Error('התשובה חזרה בפורמט לא צפוי. נסה שוב.');
    }

    return parsed as GeneratedDimensions;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

/**
 * Images are optional: Claude does not generate them, so this uses the same
 * fal.ai model the edge function used, with a key the user supplies separately.
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
