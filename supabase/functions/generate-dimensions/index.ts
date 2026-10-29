// CultureArch: turns a cultural concept into the article model.
//
// Runs on Gemini's free tier (GEMINI_API_KEY in the project's Edge Function
// secrets, shared with the other apps in this Supabase project). The key never
// reaches the browser, and no paid key is needed anywhere.
//
// APP_PASSCODE is optional. The site is public, so without it anyone who finds
// the page can use the shared quota; set it to require a shared word.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

// How many distilled readings of the bridge the article carries.
const INTERPRETATION_COUNT = 4;

// Must match HUMAN_NEEDS in src/types/article.ts
const HUMAN_NEEDS = [
  'שייכות', 'מנוחה', 'געגוע', 'משמעות', 'קהילה', 'אירוח',
  'איזון', 'חוסן', 'שינוי', 'קבלת אי-שלמות', 'חיבור לטבע', 'זמן',
];

/**
 * Grouping depends on this staying inside the closed list, but a schema enum is
 * the wrong place to enforce it: one unlisted word from the model threw away an
 * otherwise complete article. Five of the first thirty-five failed that way.
 * Take the value as text and settle it here instead.
 */
function settleNeed(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (HUMAN_NEEDS.includes(raw)) return raw;
  const near = HUMAN_NEEDS.find((need) => raw.includes(need) || need.includes(raw));
  return near ?? 'משמעות';
}

const IMAGE_STYLE =
  'Documentary realism, professional architecture photography, 1:1, natural light, no people in focus, no text, no words, no writing, no frame divisions';

const systemPrompt = `You are CultureArch — a cultural anthropologist and architect-psychologist, writing for a design magazine.
You translate a cultural concept into practical life tools and into a physical, healing space.
Work with the three-layer method: linguistic, contextual, psychological. Respect the source culture; do not flatten it and do not impose it.

Write every field in Hebrew, except origin.region_en and the two imagePrompts, which are in English.

WRITE TIGHT. This is edited magazine copy, not an encyclopaedia entry. Every sentence must earn its place: no throat-clearing, no restating the question, no "ניתן לומר ש", no summary sentence at the end. Prefer the concrete noun over the abstract one. If a sentence could be cut without loss, cut it.

Field guidance:
- origin.script: the word in its original script (間, Φιλοξενία, كرم). Latin letters if the language uses Latin script.
- origin.transliteration: Latin transliteration (Ma, Philoxenia, Karam).
- origin.literal: literal meaning in Hebrew, 2-4 words.
- origin.culture: culture name in Hebrew, at most three words (יפן, דנמרק, יוון, ערבית). Name the culture, not a list of languages.
- origin.region_en: country or region in English, specific enough to search (Japan; Denmark; Andalusia, Spain).
- lede: ONE sentence, up to about 16 words, that makes a reader want to open the piece. Concrete and surprising — an image or a claim, never a definition and never a question.
- insight: EXACTLY three sentences. First: where it comes from and what it actually names. Second: how it shows up in real life there — a ritual, a habit, a room. Third: the human need it answers and what it quiets. If the etymology is genuinely disputed, say so inside one of those sentences rather than adding a fourth.
- spaceName: a poetic Hebrew name for a space embodying the concept, two to four words.
- proverb: ONE original line in Hebrew written in the spirit of the concept, up to 12 words. Never present it as a real proverb of that culture.
- interpretation: EXACTLY ${INTERPRETATION_COUNT} short lines in Hebrew, each a distilled reading of the bridge to Israeli or Jewish culture. Each line stands on its own, at most about twelve words, no numbering and no trailing full stop. Give ${INTERPRETATION_COUNT} genuinely different angles — a parallel local concept, what the foreign one adds that the local one lacks, where the two pull apart, and what it asks of a person here — not four rewordings of one sentence.
- humanNeed: copy EXACTLY one value from this list, character for character, and nothing else: ${HUMAN_NEEDS.join(' | ')}. Pick the closest even when none is a perfect fit.
- practice.why/how/when/where: ONE short sentence each, at most 14 words. why — the need it serves. how — a concrete daily action. when — the situations it helps most. where — material, light, texture, threshold.
- imagePrompts.exterior: detailed English prompt for the concept embodied in a real place in its region of origin (name the region). End with: '${IMAGE_STYLE}'
- imagePrompts.interior: detailed English prompt for a healing living space in Israel (name a landscape — Judean foothills, Galilee, Negev, Mediterranean coast) that translates the concept into material, light, texture and tension without imitating the source culture. End with: '${IMAGE_STYLE}'

Never invent sources, quotes or statistics. Be precise about the language of origin.`;

// Free Gemini models are sometimes busy (503), so lighter ones follow.
// 2.5 Flash with thinking switched off answers in about 10-20 seconds; the
// "latest" alias thinks first and took up to 75, which read as a dead app.
const GEMINI_MODELS = [
  ...new Set([
    Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
  ]),
];

// Each try is capped so that all of them fit inside the function's 150s limit.
const MODEL_TIMEOUT_MS = 45000;

const S = { type: 'STRING' };
const GEMINI_SCHEMA = {
  type: 'OBJECT',
  required: ['origin', 'lede', 'insight', 'spaceName', 'proverb', 'interpretation', 'humanNeed', 'practice', 'imagePrompts'],
  properties: {
    origin: {
      type: 'OBJECT',
      required: ['script', 'transliteration', 'literal', 'culture', 'region_en'],
      properties: { script: S, transliteration: S, literal: S, culture: S, region_en: S },
    },
    lede: S,
    insight: S,
    spaceName: S,
    proverb: S,
    interpretation: { type: 'ARRAY', items: S },
    humanNeed: S,
    practice: {
      type: 'OBJECT',
      required: ['why', 'how', 'when', 'where'],
      properties: { why: S, how: S, when: S, where: S },
    },
    imagePrompts: {
      type: 'OBJECT',
      required: ['exterior', 'interior'],
      properties: { exterior: S, interior: S },
    },
  },
};

async function geminiOnce(key: string, model: string, userLine: string): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userLine }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_SCHEMA,
          // Thinking only adds wait here; the schema already shapes the answer.
          ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw Object.assign(new Error(`Gemini ${model} ${response.status}`), { status: response.status });
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return JSON.parse(text);
}

async function viaGemini(key: string, userLine: string): Promise<Record<string, unknown>> {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiOnce(key, model, userLine);
    } catch (error) {
      last = error;
      const status = (error as { status?: number }).status;
      // A wrong key will not work with another model either. A 400 may be one
      // model refusing a setting, so the next model still gets its turn.
      if (status === 401 || status === 403) throw error;
    }
  }
  throw last;
}

const MIXED_SCRIPT = /[\u0590-\u05FF][\u0400-\u04FF\u0600-\u06FF]|[\u0400-\u04FF\u0600-\u06FF][\u0590-\u05FF]/;

/** The Hebrew text of the article; the script and the image prompts may rightly be foreign. */
function hebrewFields(p: Record<string, unknown>): string {
  const { origin, imagePrompts: _prompts, ...rest } = p as { origin?: Record<string, unknown>; imagePrompts?: unknown };
  const { script: _script, ...originRest } = origin ?? {};
  return JSON.stringify([rest, originRest]);
}

/** The article, or { error } with a Hebrew message. */
async function writeArticle(geminiKey: string, userLine: string): Promise<Record<string, unknown>> {
  let parsed: Record<string, unknown>;
  try {
    parsed = await viaGemini(geminiKey, userLine);
    // With thinking off the model now and then slips a Cyrillic or Arabic
    // letter into a Hebrew word ("לדказа"). One more try nearly always clears it.
    if (MIXED_SCRIPT.test(hebrewFields(parsed))) parsed = await viaGemini(geminiKey, userLine);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) {
      return { error: 'מפתח Gemini שבשרת נדחה. בדקי את GEMINI_API_KEY בסודות של Supabase.' };
    }
    if (status === 400) {
      return { error: 'Gemini דחה את הבקשה (400). ייתכן שהמפתח שבשרת אינו תקין.' };
    }
    if (status === 429) {
      return { error: 'המכסה החינמית של Gemini התמלאה לרגע. המתיני דקה ונסי שוב.' };
    }
    if (error instanceof SyntaxError) {
      return { error: 'התשובה חזרה בפורמט לא צפוי. נסה שוב.' };
    }
    return { error: 'Gemini עמוס כרגע. נסי שוב בעוד רגע.' };
  }

  // The schema cannot pin the count, so hold the contract here: drop extras,
  // and never hand the UI an empty list.
  const lines = Array.isArray(parsed.interpretation)
    ? (parsed.interpretation as unknown[])
        .map((line) => String(line).trim())
        .filter(Boolean)
        .slice(0, INTERPRETATION_COUNT)
    : [];
  if (lines.length === 0) {
    return { error: 'המודל לא החזיר פרשנות. נסה שוב.' };
  }
  parsed.interpretation = lines;
  parsed.humanNeed = settleNeed(parsed.humanNeed);

  return parsed;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!geminiKey) {
      return json({ error: 'מפתח Gemini לא הוגדר בשרת. יש להוסיף GEMINI_API_KEY בסודות של Edge Functions.' }, 500);
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

    // Writing takes 20-60 seconds, and a connection that stays silent that long
    // is cut on the way (the browser saw a CORS error at about 30s while the
    // article finished on the server). So the reply starts at once and a space
    // goes out every few seconds; JSON ignores leading whitespace, and the
    // client already reads { error } from a 200 body.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const beat = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000);
        controller.enqueue(encoder.encode(' '));
        let result: unknown;
        try {
          result = await writeArticle(geminiKey, userLine);
        } catch (error) {
          result = { error: error instanceof Error ? error.message : String(error) };
        }
        clearInterval(beat);
        controller.enqueue(encoder.encode(JSON.stringify(result)));
        controller.close();
      },
    });
    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
