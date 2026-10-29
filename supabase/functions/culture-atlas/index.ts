// CultureArch atlas: compares cultures across the library.
//
//   theme   - one human need, every culture that answers it: the shared core,
//             what each reading stresses, the tensions between them.
//   culture - one culture against all the others: where its answer differs.
//   suggest - expressions unique to a culture that the library does not hold.
//
// Runs on Gemini's free tier (GEMINI_API_KEY), like generate-dimensions, and
// streams spaces while the model writes so the browser connection stays open.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

// Must match HUMAN_NEEDS in src/types/article.ts
const HUMAN_NEEDS = [
  'שייכות', 'מנוחה', 'געגוע', 'משמעות', 'קהילה', 'אירוח',
  'איזון', 'חוסן', 'שינוי', 'קבלת אי-שלמות', 'חיבור לטבע', 'זמן',
];

const BASE = `You are CultureArch's comparative lens: a cultural anthropologist and architect-psychologist.
You compare how cultures answer human needs, and translate the comparison into space: material, light, threshold, rhythm.
Write in natural, concise, professional Hebrew. No exclamation marks, no emoji, no filler.
Work only from the material you are given plus well-established knowledge. Never invent sources, quotes, statistics or rituals. When something is uncertain, say so in the sentence itself.
Respect each culture: do not flatten it, rank it or exoticise it.`;

const VISUAL = `visual: an illustration for the comparison, following Anat's image method.
- visual.distill: ONE Hebrew sentence that distils what the image must show.
- visual.prompt: a Midjourney prompt written in HEBREW ONLY (except the fixed English tail). Build it in layers: the core idea made physical, the architectural space, material and texture as heroes, a precise light source and quality, a composition rule (rule of thirds, golden section or leading lines), a colour palette, mood, and one clear tension (light/shadow, full/empty, old/new, order/chaos). Every detail must earn its place. No people's faces.
  End exactly with: "Documentary realism, Professional architecture photography, 1:1 --no text, words, writing, frame divisions"`;

const S = { type: 'STRING' };
const strings = { type: 'ARRAY', items: S };
const visualSchema = { type: 'OBJECT', required: ['distill', 'prompt'], properties: { distill: S, prompt: S } };

const MODES: Record<string, { system: string; schema: unknown; user: (b: Record<string, unknown>) => string }> = {
  theme: {
    system: `${BASE}

Task: one human need, several cultures that answer it. Map the overlap and the differences.
- core: 2-3 sentences. What all these readings share at their root.
- rows: one per concept given, same order. culture and concept copied as given.
  emphasis - what this reading stresses that the others stress less (one sentence, up to 14 words).
  mechanism - how it works in life: ritual, habit, time, relationship or object (up to 10 words).
  space - its spatial translation: material, light, threshold, scale (up to 12 words).
  unique - the one thing only this culture brings to the need (up to 12 words).
- tensions: 2-4 axes on which the readings pull apart. axis - the axis name (2-4 words). poles - which concepts sit at each end. meaning - what the tension reveals (one sentence).
- insights: exactly 3 sharp insights a designer can act on.
- design: exactly 4 principles for one space that holds the shared core and the differences (each up to 14 words).
${VISUAL}`,
    schema: {
      type: 'OBJECT',
      required: ['core', 'rows', 'tensions', 'insights', 'design', 'visual'],
      properties: {
        core: S,
        rows: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            required: ['culture', 'concept', 'emphasis', 'mechanism', 'space', 'unique'],
            properties: { culture: S, concept: S, emphasis: S, mechanism: S, space: S, unique: S },
          },
        },
        tensions: {
          type: 'ARRAY',
          items: { type: 'OBJECT', required: ['axis', 'poles', 'meaning'], properties: { axis: S, poles: S, meaning: S } },
        },
        insights: strings,
        design: strings,
        visual: visualSchema,
      },
    },
    user: (b) =>
      `הצורך: ${b.need}\n\nהמושגים:\n${(b.items as Record<string, string>[])
        .map((i) => `- ${i.concept} (${i.culture}; ${i.transliteration}; "${i.literal}"): ${i.insight} | איך: ${i.how} | איפה: ${i.where}`)
        .join('\n')}`,
  },

  culture: {
    system: `${BASE}

Task: one culture, read against all the others in the library. Show what makes it distinct.
- essence: 2-3 sentences. The culture's characteristic way of answering human needs, as seen through its concepts.
- signatures: exactly 3 traits that mark this culture's answers. trait - 2-5 words. evidence - which of its concepts shows it and how (one sentence).
- rows: one per human need this culture answers (from its concepts). need - copied as given. ownAnswer - its concept and how it answers (up to 16 words). othersAnswer - how other cultures in the library answer the same need, naming 1-3 concepts (up to 18 words; if no other culture answers it, say so). difference - the decisive difference (up to 14 words).
- blindSpots: needs from the list that this culture's concepts in the library do not address, and what other cultures offer there. need - copied from the list. note - one sentence. Up to 4. Say clearly this reflects the library, not the culture as a whole.
- insights: exactly 3 insights a designer can act on.
${VISUAL}`,
    schema: {
      type: 'OBJECT',
      required: ['essence', 'signatures', 'rows', 'blindSpots', 'insights', 'visual'],
      properties: {
        essence: S,
        signatures: {
          type: 'ARRAY',
          items: { type: 'OBJECT', required: ['trait', 'evidence'], properties: { trait: S, evidence: S } },
        },
        rows: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            required: ['need', 'ownAnswer', 'othersAnswer', 'difference'],
            properties: { need: S, ownAnswer: S, othersAnswer: S, difference: S },
          },
        },
        blindSpots: {
          type: 'ARRAY',
          items: { type: 'OBJECT', required: ['need', 'note'], properties: { need: S, note: S } },
        },
        insights: strings,
        visual: visualSchema,
      },
    },
    user: (b) =>
      `התרבות: ${b.culture}\n\nהמושגים שלה:\n${(b.own as Record<string, string>[])
        .map((i) => `- ${i.concept} [${i.need}] "${i.literal}": ${i.insight}`)
        .join('\n')}\n\nמושגים של תרבויות אחרות בספרייה:\n${(b.others as Record<string, string>[])
        .map((i) => `- ${i.concept} (${i.culture}) [${i.need}]`)
        .join('\n')}\n\nרשימת הצרכים: ${HUMAN_NEEDS.join(' | ')}`,
  },

  suggest: {
    system: `${BASE}

Task: suggest cultural expressions that are distinctive of ONE culture and are not yet in the library.
- items: exactly 6. Each must be a real, documented word or practice of that culture - a well-known one, never invented. Prefer expressions with a spatial or everyday-life dimension. Spread them across different human needs.
  concept - the name in Hebrew letters, as a Hebrew reader would search it (e.g. אומוטנאשי, פיקה).
  transliteration - Latin transliteration. script - the original script.
  literal - literal meaning in Hebrew, 2-4 words.
  need - copy EXACTLY one value from: ${HUMAN_NEEDS.join(' | ')}.
  why - one Hebrew sentence: what makes it distinctive of this culture.
Do not repeat or rephrase any concept already in the library list.`,
    schema: {
      type: 'OBJECT',
      required: ['items'],
      properties: {
        items: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            required: ['concept', 'transliteration', 'script', 'literal', 'need', 'why'],
            properties: { concept: S, transliteration: S, script: S, literal: S, need: S, why: S },
          },
        },
      },
    },
    user: (b) =>
      `התרבות: ${b.culture}\nכבר בספרייה (של התרבות): ${(b.existing as string[]).join(', ') || 'אין'}\nכל הספרייה: ${(b.library as string[]).join(', ')}`,
  },
};

// Same choice as generate-dimensions: 2.5 Flash with thinking off answers in
// seconds; over 20 seconds reads as broken (CLAUDE.md).
const GEMINI_MODELS = [
  ...new Set([Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest']),
];

async function geminiOnce(key: string, model: string, system: string, schema: unknown, user: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
      signal: AbortSignal.timeout(40000),
    },
  );
  if (!response.ok) {
    throw Object.assign(new Error(`Gemini ${model} ${response.status}`), { status: response.status });
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return JSON.parse(text) as Record<string, unknown>;
}

async function run(key: string, system: string, schema: unknown, user: string): Promise<Record<string, unknown>> {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiOnce(key, model, system, schema, user);
    } catch (error) {
      last = error;
      const status = (error as { status?: number }).status;
      if (status === 400 || status === 401 || status === 403) break;
    }
  }
  const status = (last as { status?: number })?.status;
  if (status === 401 || status === 403) return { error: 'מפתח Gemini שבשרת נדחה. בדקי את GEMINI_API_KEY בסודות של Supabase.' };
  if (status === 429) return { error: 'המכסה החינמית של Gemini התמלאה לרגע. המתיני דקה ונסי שוב.' };
  if (last instanceof SyntaxError) return { error: 'התשובה חזרה בפורמט לא צפוי. נסי שוב.' };
  return { error: 'Gemini עמוס כרגע. נסי שוב בעוד רגע.' };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!key) return json({ error: 'מפתח Gemini לא הוגדר בשרת (GEMINI_API_KEY).' }, 500);

    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) {
      return json({ error: 'קוד הגישה שגוי. הזן אותו במסך ההגדרות.' }, 401);
    }

    const body = (await req.json()) as Record<string, unknown>;
    const mode = MODES[String(body.mode)];
    if (!mode) return json({ error: 'סוג הבקשה לא מוכר.' }, 400);

    const user = mode.user(body);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const beat = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000);
        controller.enqueue(encoder.encode(' '));
        let result: unknown;
        try {
          result = await run(key, mode.system, mode.schema, user);
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
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
