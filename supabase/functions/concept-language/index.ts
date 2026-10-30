// CultureArch: the anatomy of a word - its parts, its root, the words around it
// in its own language - and what its language reveals about the culture.
//
// The facts come from English Wiktionary, the entry for the word in its own
// script or spelling: the etymology and the language section are handed to
// Gemini as the only source for the parts and the root. Related words and the
// "what it reveals" line are interpretation and are labelled so on the page.
// Without an entry the result is marked basis "model".
//
// Reads the article from the table and writes into origin.lang, so a public
// caller can only enrich the library itself.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
const TABLE = 'culture_articles';

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`DB ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : await r.json();
}

// Must match the keys of LANGUAGES in src/data/languages.ts
const CODES = ['he', 'ar', 'ja', 'zh', 'ko', 'sa', 'hi', 'sv', 'da', 'no', 'fi', 'de', 'nl', 'af', 'es', 'pt', 'it', 'fr', 'el', 'ru', 'cy', 'ga', 'zu', 'tn', 'sw', 'ak', 'tr', 'fa'];

// ---------- Wiktionary ----------

const HEADERS = { 'User-Agent': 'CultureArch/1.0 (https://culturearch.vercel.app)' };
const pageUrl = (title: string) => `https://en.wiktionary.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

/** The language sections of one entry, as plain wikitext, trimmed. */
async function entry(title: string): Promise<{ title: string; sections: string } | null> {
  const url = `https://en.wiktionary.org/w/api.php?${new URLSearchParams({
    action: 'parse', page: title, prop: 'wikitext', format: 'json', formatversion: '2', redirects: '1', origin: '*',
  })}`;
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const d = await r.json();
  const text: string = d?.parse?.wikitext ?? '';
  if (!text) return null;
  // Keep each "==Language==" section short; drop translation tables and quotations.
  const parts = text.split(/\n(?===[^=])/).map((s) =>
    s.replace(/\{\{trans-top[\s\S]*?\{\{trans-bottom\}\}/g, '').replace(/#\*.*$/gm, '').slice(0, 2500),
  );
  return { title: d.parse.title ?? title, sections: parts.slice(0, 4).join('\n') };
}

async function findEntry(terms: string[]) {
  for (const t of terms.map((x) => x.trim()).filter(Boolean)) {
    for (const v of [...new Set([t, t.toLowerCase()])]) {
      const e = await entry(v);
      if (e) return e;
    }
  }
  return null;
}

// ---------- Gemini ----------

const S = { type: 'STRING' };
const SCHEMA = {
  type: 'OBJECT',
  required: ['code', 'parts', 'root', 'family', 'richness', 'untranslatable', 'insight', 'explanation', 'fromSource'],
  properties: {
    code: S,
    parts: { type: 'ARRAY', items: { type: 'OBJECT', required: ['part', 'meaning'], properties: { part: S, meaning: S } } },
    root: S,
    family: {
      type: 'ARRAY',
      items: { type: 'OBJECT', required: ['word', 'transliteration', 'meaning'], properties: { word: S, transliteration: S, meaning: S } },
    },
    richness: S,
    untranslatable: S,
    insight: S,
    explanation: S,
    fromSource: { type: 'BOOLEAN' },
  },
};

const SYSTEM = `You are a linguist and cultural anthropologist writing for a Hebrew design magazine.
You receive one cultural word and, when found, its English Wiktionary entry as SOURCE (wikitext).
Write every text field in Hebrew. Natural, short, professional. No exclamation marks.

Return:
- code: the ISO 639-1 code of the word's language, one of: ${CODES.join(', ')}. If none fits, the closest relative in that list.
- parts: how the word is built - its morphemes, characters or components, each with its meaning in Hebrew (2-5 words). Take them from the SOURCE etymology. Up to 5. If the word is not divisible, one part.
- root: the root or source word it grows from, with its meaning, e.g. "שורש ק-ר-ב: קרבה" or "מהנורדית העתיקה hugga: לנחם". Empty if the SOURCE does not give one.
- family: up to 5 words in the SAME language from the same semantic field (near-synonyms or the same root), each with its original spelling, Latin transliteration and Hebrew meaning. Only words you are sure exist.
- richness: one sentence, up to 20 words: whether this language has many words for this field, compared with Hebrew. Interpretation, careful.
- untranslatable: one sentence, up to 20 words: what Hebrew lacks in order to say this in one word.
- insight: what the word's STRUCTURE reveals about the culture, up to 8 words, ending with a full stop, with the key concept in **double asterisks**. It must come from the parts or the root, never a generic "the culture values X". Examples of the level wanted: "**שער** ושמש: רווח הוא מה שמכניס אור." / "**לחשוב** ולנחם: הנחמה מתחילה במחשבה."
- explanation: one sentence, up to 20 words, explaining the insight, with 2-3 **highlighted** key terms.
- fromSource: true only if parts and root come from the SOURCE.

Never invent etymologies, roots or words. If the SOURCE is missing or thin, keep parts minimal, leave root empty and set fromSource false.`;

const GEMINI_MODELS = [Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

async function ask(key: string, user: string): Promise<Record<string, unknown>> {
  let last: unknown;
  for (const model of [...new Set(GEMINI_MODELS)]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCHEMA,
            ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (!r.ok) throw Object.assign(new Error(`Gemini ${model} ${r.status}`), { status: r.status });
      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      return JSON.parse(text);
    } catch (e) {
      last = e;
      const status = (e as { status?: number }).status;
      if (status === 401 || status === 403) break;
    }
  }
  throw last;
}

const clean = (v: unknown) => String(v ?? '').trim();
// Hebrew with a Cyrillic or Arabic letter inside a word: the fast model's known slip.
const MIXED = /[֐-׿][Ѐ-ӿ؀-ۿ]|[Ѐ-ӿ؀-ۿ][֐-׿]/;
const hebrewText = (o: Record<string, unknown>) =>
  [o.root, o.richness, o.untranslatable, o.insight, o.explanation,
    ...((o.parts as { meaning?: string }[]) ?? []).map((p) => p.meaning),
    ...((o.family as { meaning?: string }[]) ?? []).map((p) => p.meaning)].map(clean).join(' ');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!key) return json({ error: 'מפתח Gemini לא הוגדר בשרת.' }, 500);
    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) return json({ error: 'קוד הגישה שגוי.' }, 401);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.articleId ?? '').replace(/[^\w-]/g, '');
    if (!id) return json({ error: 'חסר מזהה מאמר.' }, 400);

    const [row] = await rest(`${TABLE}?id=eq.${id}&select=id,concept,origin`);
    if (!row) return json({ error: 'המאמר עוד לא נשמר בשרת.', retry: true }, 404);
    const origin = (row.origin ?? {}) as Record<string, unknown>;
    if ((origin.lang as Record<string, unknown> | undefined)?.insight && !body.force) {
      return json({ lang: origin.lang, skipped: true });
    }

    const found = await findEntry([clean(origin.script), clean(origin.transliteration)]);
    const user = [
      `Word: ${clean(origin.script)} (${clean(origin.transliteration)}), Hebrew name "${row.concept}"`,
      `Culture: ${clean(origin.culture)} - ${clean(origin.region_en)}`,
      `Literal meaning: ${clean(origin.literal)}`,
      found ? `SOURCE (English Wiktionary, "${found.title}"):\n${found.sections}` : 'SOURCE: no Wiktionary entry found.',
    ].join('\n');

    let out = await ask(key, user);
    if (MIXED.test(hebrewText(out))) out = await ask(key, `${user}\n\nIMPORTANT: Hebrew fields in Hebrew letters only.`);

    const fromSource = !!found && out.fromSource === true;
    const code = CODES.includes(clean(out.code)) ? clean(out.code) : '';
    const lang = {
      code,
      parts: ((out.parts as { part: string; meaning: string }[]) ?? []).slice(0, 5).map((p) => ({ part: clean(p.part), meaning: clean(p.meaning) })),
      root: fromSource ? clean(out.root) : '',
      family: ((out.family as Record<string, string>[]) ?? []).slice(0, 5).map((f) => ({
        word: clean(f.word), transliteration: clean(f.transliteration), meaning: clean(f.meaning),
      })),
      richness: clean(out.richness),
      untranslatable: clean(out.untranslatable),
      insight: clean(out.insight),
      explanation: clean(out.explanation),
      source: found ? pageUrl(found.title) : '',
      basis: fromSource ? 'wiktionary' : 'model',
    };

    await rest(`${TABLE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ origin: { ...origin, lang } }) });
    return json({ lang });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 429) return json({ error: 'המכסה החינמית של Gemini התמלאה לרגע.', retry: true }, 429);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
