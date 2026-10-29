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
    // The first run, without these rules, produced invented words, a curse and a
    // slur. The rules and the confidence field are what filter them now.
    system: `${BASE}

Task: suggest cultural expressions that are distinctive of ONE culture and are not yet in the library.
Accuracy matters more than count. A wrong or invented word is far worse than a short list.
- items: up to 8. Only expressions that a well-read person could find in an English-language encyclopedia, dictionary or a widely read book about the culture. If fewer than 8 qualify, return fewer.
  Never suggest: slurs or words for outsiders, curses, bodily functions, political or military slogans, personal names, day names, place names or neighbourhoods, brand names, or plain dictionary words with no cultural weight (such as "hardworking" or "dinner").
  Prefer expressions with a spatial or everyday-life dimension, spread across different human needs.
  concept - the name in Hebrew letters, spelled the way it is commonly written in Hebrew (e.g. אומוטנאשי, פיקה, דוגנד, מיאנזי). Spell the whole word, not a fragment of it.
  transliteration - the accepted Latin spelling, with diacritics. script - the original script.
  english - how it is usually referred to in English sources (e.g. "Allemansrätten (freedom to roam)").
  literal - literal meaning in Hebrew, 2-4 words.
  need - copy EXACTLY one value from: ${HUMAN_NEEDS.join(' | ')}.
  why - one Hebrew sentence: what makes it distinctive of this culture.
  confidence - high: well documented and you are sure of meaning and spelling; medium: real but you are unsure of a detail; low: you are not sure it exists as a cultural concept.
Do not repeat or rephrase any concept already in the library list.`,
    schema: {
      type: 'OBJECT',
      required: ['items'],
      properties: {
        items: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            required: ['concept', 'transliteration', 'script', 'english', 'literal', 'need', 'why', 'confidence'],
            properties: {
              concept: S,
              transliteration: S,
              script: S,
              english: S,
              literal: S,
              need: S,
              why: S,
              confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            },
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
      console.error('culture-atlas', model, error instanceof Error ? error.message : error);
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

// ---------- Verification against Wikipedia ----------
// The model's own confidence proved worthless: it rated invented words "high".
// So every suggestion is checked against English Wikipedia, an outside source.
// title   - a page under this exact name, or one that redirects from it: verified.
// mention - the word appears in some article: shown with that article, to judge.
// none    - nowhere.
// Tested on the first run's output: every real concept came back "title", and
// every invented word, curse and slur came back "mention" or "none".

const WIKI_HEADERS = { 'User-Agent': 'CultureArch/1.0 (https://anat1969.github.io/cultura-GH/)' };
const norm = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}]/gu, '');
const words = (v: string) => v.replace(/<[^>]+>/g, ' ').split(/[^\p{L}\p{M}'-]+/u).map(norm).filter(Boolean);
const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

async function wiki(params: Record<string, string>) {
  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const response = await fetch(url, { headers: WIKI_HEADERS, signal: AbortSignal.timeout(6000) });
  return response.ok ? await response.json() : null;
}

async function verify(item: Record<string, unknown>) {
  const term = String(item.transliteration ?? '').trim();
  const key = norm(term);
  if (!key) return { ...item, verified: 'none' };
  try {
    const direct = await wiki({
      action: 'query',
      titles: term,
      redirects: '1',
      prop: 'pageprops|langlinks',
      ppprop: 'disambiguation',
      lllang: 'he',
    });
    const page = Object.values(direct?.query?.pages ?? {})[0] as
      | { title: string; missing?: string; pageprops?: unknown; langlinks?: { '*': string }[] }
      | undefined;
    if (page && !('missing' in page) && !page.pageprops) {
      return {
        ...item,
        verified: 'title',
        source: wikiUrl(page.title),
        sourceTitle: page.title,
        hebrewTitle: page.langlinks?.[0]?.['*'] ?? '',
      };
    }
    const found = await wiki({ action: 'query', list: 'search', srsearch: `"${term}"`, srlimit: '5' });
    const hit = ((found?.query?.search ?? []) as { title: string; snippet: string }[]).find((h) =>
      words(`${h.title} ${h.snippet}`).includes(key),
    );
    return hit
      ? { ...item, verified: 'mention', source: wikiUrl(hit.title), sourceTitle: hit.title }
      : { ...item, verified: 'none' };
  } catch {
    return { ...item, verified: 'none' };
  }
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
          const items = (result as { items?: Record<string, unknown>[] }).items;
          if (body.mode === 'suggest' && Array.isArray(items)) {
            result = { items: await Promise.all(items.map(verify)) };
          }
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
