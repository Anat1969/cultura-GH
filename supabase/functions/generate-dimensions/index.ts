// CultureArch: turns a cultural concept into the article model.
//
// The Anthropic key lives here as a secret and never reaches the browser, which
// is the whole reason this function exists rather than the app calling Claude
// directly. Set ANTHROPIC_API_KEY in the project's Edge Function secrets - or
// any name containing "anthropic" or "claude", which is also accepted.
//
// APP_PASSCODE is optional. The site is public, so without it anyone who finds
// the page can spend the account's credits; set it to require a shared word.
import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.128.0/helpers/zod';
import * as z from 'npm:zod@4.6.5/v4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

const MODEL = 'claude-opus-5';

const CANONICAL = 'ANTHROPIC_API_KEY';

/**
 * Finds the key by its documented name, and failing that under any secret whose
 * name mentions Anthropic or Claude. Naming a secret is not the interesting
 * part of the task, and a near miss should not read as a missing key.
 *
 * When nothing matches, reports the NAMES of related secrets - never a value.
 */
function readKey(): { key?: string; via?: string; seen: string[] } {
  const direct = Deno.env.get(CANONICAL);
  if (direct?.trim()) return { key: direct.trim(), via: CANONICAL, seen: [] };

  let names: string[] = [];
  try {
    names = Object.keys(Deno.env.toObject());
  } catch {
    return { seen: [] };
  }

  const candidates = names.filter(
    (n) => /anthropic|claude/i.test(n) && !/^SUPABASE_/i.test(n) && !/passcode/i.test(n),
  );
  for (const name of candidates) {
    const value = Deno.env.get(name);
    if (value?.trim()) return { key: value.trim(), via: name, seen: [] };
  }

  return {
    seen: names.filter((n) => /anthropic|claude|api|key|token|fal/i.test(n) && !/^SUPABASE_/i.test(n)),
  };
}

// Must match HUMAN_NEEDS in src/types/article.ts
const HUMAN_NEEDS = [
  'שייכות', 'מנוחה', 'געגוע', 'משמעות', 'קהילה', 'אירוח',
  'איזון', 'חוסן', 'שינוי', 'קבלת אי-שלמות', 'חיבור לטבע', 'זמן',
] as const;

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { key: apiKey, seen } = readKey();
    if (!apiKey) {
      const hint = seen.length
        ? ` נמצאו סודות בשמות: ${seen.join(', ')}.`
        : ' לא נמצא אף סוד מתאים בפרויקט.';
      return json(
        {
          error:
            'מפתח Claude לא הוגדר בשרת. יש להוסיף ANTHROPIC_API_KEY בסודות של Edge Functions.' + hint,
        },
        500,
      );
    }

    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) {
      return json({ error: 'קוד הגישה שגוי. הזן אותו במסך ההגדרות.' }, 401);
    }

    const { concept, hint } = await req.json();
    if (!concept || typeof concept !== 'string') {
      return json({ error: 'לא התקבל מושג ליצירה.' }, 400);
    }

    const userLine = `המושג התרבותי: ${concept}${
      typeof hint === 'string' && hint.trim() ? `\nHint: ${hint.trim()}` : ''
    }`;

    const client = new Anthropic({ apiKey });

    const base = {
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt,
      thinking: { type: 'adaptive' as const },
      output_config: { format: zodOutputFormat(DimensionsSchema) },
      messages: [{ role: 'user' as const, content: userLine }],
    };

    let stopReason: string | null;
    let parsed: unknown;

    try {
      // A policy decline would leave the user with nothing, so let the API
      // re-run the same request on another model rather than failing.
      const response = await client.beta.messages.parse({
        ...base,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
      stopReason = response.stop_reason;
      parsed = response.parsed_output;
    } catch (error) {
      // If this account or endpoint will not take the fallback beta, generating
      // at all matters more than the extra resilience.
      if (!(error instanceof Anthropic.BadRequestError)) throw error;
      const response = await client.messages.parse(base);
      stopReason = response.stop_reason;
      parsed = response.parsed_output;
    }

    if (stopReason === 'refusal') {
      return json({ error: 'הבקשה נדחתה. נסה לנסח את המושג אחרת.' }, 422);
    }
    if (!parsed) {
      return json({ error: 'התשובה חזרה בפורמט לא צפוי. נסה שוב.' }, 502);
    }

    return json(parsed);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json(
        { error: 'המפתח שמוגדר בשרת נדחה על ידי Anthropic. ייתכן שהוא הועתק חלקית, פג תוקף, או שזה אינו מפתח API של Anthropic.' },
        500,
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'יותר מדי בקשות בזמן קצר. המתן רגע ונסה שוב.' }, 429);
    }
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
