// CultureArch: where a word comes from - time, place, figure, story - plus what
// the globe, the time axis and the flags need (country, coordinates, tradition).
//
// Facts come from English Wikipedia when it has the word: the page text is
// handed to Gemini as the only source for the story, the figure and the date.
// Without a page the model may still estimate the period and place, but the
// result is marked basis "model" and the figure is left empty, so the page can
// say plainly that it was not verified (CLAUDE.md: model output about cultures
// is checked outside the model).
//
// Reads the article from the table and writes the result into its origin, so a
// public caller can only enrich the library itself.

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

// Must match TRADITIONS in src/data/geo.ts
const TRADITIONS = [
  'יהדות', 'נצרות', 'אסלאם', 'בודהיזם', 'הינדואיזם', 'דאואיזם וקונפוציאניזם', 'שינטו',
  'מסורת עממית', 'מסורת שבטית', 'חילוני ומודרני',
];

// ---------- Wikipedia ----------

const WIKI_HEADERS = { 'User-Agent': 'CultureArch/1.0 (https://culturearch.vercel.app)' };
const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
const norm = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}]/gu, '');

async function wiki(params: Record<string, string>) {
  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const r = await fetch(url, { headers: WIKI_HEADERS, signal: AbortSignal.timeout(8000) });
  return r.ok ? await r.json() : null;
}

type Page = { title: string; text: string };

async function extract(title: string): Promise<Page | null> {
  const d = await wiki({
    action: 'query', titles: title, redirects: '1', prop: 'extracts|pageprops', explaintext: '1', ppprop: 'disambiguation',
  });
  const page = Object.values(d?.query?.pages ?? {})[0] as
    | { title: string; missing?: string; pageprops?: unknown; extract?: string }
    | undefined;
  if (!page || 'missing' in page || page.pageprops || !page.extract) return null;
  return { title: page.title, text: page.extract.slice(0, 3500) };
}

/**
 * Candidate pages named after the word. A name is not enough - "Ubuntu" is
 * first of all a Linux system - so the model is shown every candidate and
 * names the one that is about this cultural concept, or none.
 */
async function candidates(term: string, concept: string, region: string): Promise<Page[]> {
  const titles = new Set<string>();
  for (const t of [term, concept]) if (t) titles.add(t);
  const key = norm(term || concept);
  const s = await wiki({ action: 'query', list: 'search', srsearch: `${term || concept} ${region}`.trim(), srlimit: '6' });
  for (const h of (s?.query?.search ?? []) as { title: string }[]) {
    if (key && norm(h.title).includes(key)) titles.add(h.title);
  }
  const pages: Page[] = [];
  for (const t of [...titles].slice(0, 4)) {
    const p = await extract(t);
    if (p && !pages.some((q) => q.title === p.title)) pages.push(p);
  }
  return pages;
}

// ---------- Gemini ----------

const S = { type: 'STRING' };
const SCHEMA = {
  type: 'OBJECT',
  required: ['sourceIndex', 'country', 'lat', 'lng', 'place', 'tradition', 'year', 'era', 'figure', 'story', 'fromSource'],
  properties: {
    sourceIndex: { type: 'INTEGER' },
    country: S, lat: { type: 'NUMBER' }, lng: { type: 'NUMBER' }, place: S, tradition: S,
    year: { type: 'INTEGER' }, era: S, figure: S, story: S, fromSource: { type: 'BOOLEAN' },
  },
};

const SYSTEM = `Write place, era, figure and story in HEBREW. You are a careful etymologist and cultural historian. You receive one cultural word or concept and up to four candidate English Wikipedia pages, numbered SOURCE 1, SOURCE 2 and so on.

First decide which candidate is about THIS cultural word as the culture named uses it (not a product, a company, a place, a band or a different meaning). Return its number as sourceIndex, or 0 if none is. Use only that page as SOURCE below; ignore the others.

Return, in Hebrew except where stated:
- country: ISO 3166-1 alpha-2 code (two uppercase letters) of the present-day country most associated with the word's origin. For a tradition spread across countries, the country of its historical centre (Jewish tradition: IL; Arabic culture: the country named in the source, else SA).
- lat, lng: coordinates of the place of origin (city or region), decimal degrees.
- place: the place of origin in Hebrew, then the English name in parentheses, e.g. "קיוטו (Kyoto)".
- tradition: copy exactly one of: ${TRADITIONS.join(' | ')}. The religious or cultural tradition the word grew out of.
- year: the approximate year the word or practice is first attested or took shape; negative for BCE. One integer.
- era: that period in Hebrew, short, e.g. "המאה ה-18", "תקופת אדו", "המאה ה-5 לפנה״ס".
- figure: a named historical person tied to the word's origin or spread, with one clause on who they were. Only if the SOURCE names one; otherwise an empty string. Never invent a person.
- story: at most two short sentences, at most 40 words, telling how the word came to be: its roots, the moment, the scene. Concrete, magazine tone, no throat-clearing.
- fromSource: true only if year, era and story are stated or directly implied by the SOURCE. False if you relied on general knowledge.

If there is no SOURCE, give your best scholarly estimate for country, place, tradition, year and era, keep figure empty, keep the story cautious, and set fromSource false. Never invent quotes, names or dates presented as facts.`;

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

    const [row] = await rest(`${TABLE}?id=eq.${id}&select=id,concept,origin,insight`);
    if (!row) return json({ error: 'המאמר עוד לא נשמר בשרת.', retry: true }, 404);
    const origin = (row.origin ?? {}) as Record<string, unknown>;
    if (origin.story && !body.force) return json({ origin, skipped: true });

    const pages = await candidates(clean(origin.transliteration), clean(row.concept), clean(origin.region_en));
    const user = [
      `Word: ${clean(origin.transliteration) || row.concept} (${clean(origin.script)})`,
      `Hebrew name in the library: ${row.concept}`,
      `Culture: ${clean(origin.culture)} - ${clean(origin.region_en)}`,
      `Literal meaning: ${clean(origin.literal)}`,
      pages.length
        ? pages.map((p, i) => `SOURCE ${i + 1} (English Wikipedia, "${p.title}"):\n${p.text}`).join('\n\n')
        : 'SOURCE: none found.',
    ].join('\n');

    // The lighter fallback model sometimes answers in English; ask once more,
    const hebrew = (v: unknown) => /[\u0590-\u05FF]/.test(clean(v));
    let out = await ask(key, user);
    // and now and then slips a letter of another script into a Hebrew word.
    const mixed = (v: unknown) => /[\u0590-\u05FF][\u0600-\u06FF]|[\u0600-\u06FF][\u0590-\u05FF]/.test(clean(v));
    if (!hebrew(out.story) || (clean(out.figure) && !hebrew(out.figure)) || mixed(out.story) || mixed(out.place)) {
      out = await ask(key, `${user}\n\nIMPORTANT: answer place, era, figure and story in Hebrew only.`);
    }
    const country = clean(out.country).toUpperCase();
    const tradition = TRADITIONS.includes(clean(out.tradition)) ? clean(out.tradition) : 'מסורת עממית';
    const page = pages[Number(out.sourceIndex) - 1] ?? null;
    const fromSource = !!page && out.fromSource === true;
    const year = Number.isFinite(Number(out.year)) ? Math.round(Number(out.year)) : null;
    const lat = Number(out.lat), lng = Number(out.lng);

    const next = {
      ...origin,
      country: /^[A-Z]{2}$/.test(country) ? country : '',
      lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null,
      lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : null,
      place: clean(out.place),
      tradition,
      year: year !== null && year <= new Date().getFullYear() ? year : null,
      era: clean(out.era),
      // A figure is shown only when the source carried one.
      figure: fromSource ? clean(out.figure) : '',
      story: clean(out.story),
      source: page ? wikiUrl(page.title) : '',
      basis: fromSource ? 'wikipedia' : 'model',
    };

    await rest(`${TABLE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ origin: next }) });
    return json({ origin: next });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 429) return json({ error: 'המכסה החינמית של Gemini התמלאה לרגע.', retry: true }, 429);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
