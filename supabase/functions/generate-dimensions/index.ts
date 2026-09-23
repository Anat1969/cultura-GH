const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Must match HUMAN_NEEDS in src/types/article.ts
const HUMAN_NEEDS = [
  'שייכות', 'מנוחה', 'געגוע', 'משמעות', 'קהילה', 'אירוח',
  'איזון', 'חוסן', 'שינוי', 'קבלת אי-שלמות', 'חיבור לטבע', 'זמן',
];

const IMAGE_STYLE =
  'Documentary realism, professional architecture photography, 16:9, natural light, no people in focus, no text, no words, no writing, no frame divisions';

const systemPrompt = `You are CultureArch — a cultural anthropologist and architect-psychologist who has travelled the world.
You translate a cultural concept into practical life tools and into a physical, healing space.
Work with the three-layer method: linguistic, contextual, psychological. Respect the source culture; do not flatten it and do not impose it.

Given a cultural concept (in Hebrew, optionally with a hint), return EXACTLY this JSON. All text in Hebrew except imagePrompts and origin.region_en, which are in English.
{
  "origin": {
    "script": "The word in its original script (e.g. 間, Φιλοξενία, كرم). Latin letters if the language uses Latin script.",
    "transliteration": "Latin transliteration (e.g. Ma, Philoxenia, Karam)",
    "literal": "Literal meaning in Hebrew, 2-6 words",
    "culture": "Culture / language name in Hebrew, short (e.g. יפן, דנמרק, יוון, ערבית, עברית)",
    "region_en": "Country or region in English, specific enough to search (e.g. Japan; Denmark; Andalusia, Spain)"
  },
  "insight": "3-5 sentences: where and when the concept arose, how it is used in the source culture (rituals, customs, architecture), what human need it answers, what it soothes and what it promotes. If the etymology or origin is disputed or uncertain, say so explicitly in one sentence.",
  "spaceName": "A poetic Hebrew name for a space embodying the concept (e.g. 'חדר החלל הפעיל')",
  "proverb": "One ORIGINAL line in Hebrew written in the spirit of the concept. Do NOT present it as a real proverb of that culture.",
  "interpretation": "2-3 sentences: the natural bridge to Israeli or Jewish culture — a similar or complementary local concept, and what is unique in the foreign one.",
  "humanNeed": "Exactly one value from this list: ${HUMAN_NEEDS.join(', ')}",
  "practice": {
    "why": "One sentence: the human need it serves",
    "how": "One sentence: a concrete daily practice",
    "when": "One sentence: situations where it helps most",
    "where": "One sentence: how to express it in physical space — material, light, texture, threshold"
  },
  "imagePrompts": {
    "exterior": "Detailed English prompt: the concept embodied in a real place in its region of origin (name the region). End with: '${IMAGE_STYLE}'",
    "interior": "Detailed English prompt: a healing living space in Israel (name a landscape, e.g. Judean foothills, Galilee, Negev, Mediterranean coast) that translates the concept into material, light, texture and tension without imitating the source culture. End with: '${IMAGE_STYLE}'"
  }
}
Rules: never invent sources, quotes or statistics. Be precise about the language of origin. Return ONLY valid JSON. No markdown, no explanation.`;

function extractJson(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fencedMatch?.[1] ?? text).trim();
}

const isText = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

// deno-lint-ignore no-explicit-any
function validateGeneratedDimensions(payload: any) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('המודל החזיר מבנה נתונים לא תקין');
  }
  for (const field of ['insight', 'spaceName', 'proverb', 'interpretation', 'humanNeed']) {
    if (!isText(payload[field])) throw new Error(`המודל לא החזיר את השדה ${field}`);
  }
  if (!HUMAN_NEEDS.includes(payload.humanNeed.trim())) {
    // Keep grouping consistent: fall back to the closest safe bucket instead of failing.
    payload.humanNeed = 'משמעות';
  }
  const o = payload.origin;
  if (!o || !['script', 'transliteration', 'literal', 'culture', 'region_en'].every(k => isText(o[k]))) {
    throw new Error('המודל לא החזיר את שכבת המקור (origin) במלואה');
  }
  const p = payload.practice;
  if (!p || !['why', 'how', 'when', 'where'].every(k => isText(p[k]))) {
    throw new Error('המודל לא החזיר את בלוק היישום (practice) במלואו');
  }
  if (!payload.imagePrompts || !isText(payload.imagePrompts.exterior) || !isText(payload.imagePrompts.interior)) {
    throw new Error('המודל לא החזיר פרומפטים תקינים לתמונות');
  }
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { concept, hint } = await req.json();
    if (!concept || typeof concept !== 'string') {
      return new Response(JSON.stringify({ error: 'concept is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userLine = `המושג התרבותי: ${concept}${typeof hint === 'string' && hint.trim() ? `\nHint: ${hint.trim()}` : ''}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userLine}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error('המודל לא החזיר תוכן');
    }

    const parsed = validateGeneratedDimensions(JSON.parse(extractJson(text)));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
