// CultureArch: one group on the world page - a region, continent, tradition,
// period, word order or ancient civilization - read for what its members share
// and for what each keeps for itself. Written to Anat's text standard
// (Claude-GH docs/ai-text-standard.md): insight line, one sentence,
// **highlights**, a single ==insight== mark. Gemini free tier, thinking off;
// spaces stream while it writes so the browser connection stays open.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

const S = { type: 'STRING' };
const SCHEMA = {
  type: 'OBJECT',
  required: ['insight', 'explanation', 'shared', 'members', 'tension', 'language', 'action', 'haiku'],
  properties: {
    insight: S,
    explanation: S,
    shared: { type: 'ARRAY', items: { type: 'OBJECT', required: ['trait', 'evidence'], properties: { trait: S, evidence: S } } },
    members: { type: 'ARRAY', items: { type: 'OBJECT', required: ['concept', 'unique'], properties: { concept: S, unique: S } } },
    tension: { type: 'OBJECT', required: ['axis', 'poles', 'meaning'], properties: { axis: S, poles: S, meaning: S } },
    language: S,
    action: S,
    haiku: { type: 'OBJECT', required: ['lines', 'illuminates'], properties: { lines: { type: 'ARRAY', items: S }, illuminates: S } },
  },
};

const SYSTEM = `You are CultureArch's comparative lens: a cultural anthropologist, linguist and architect.
Write in natural, concise, professional Hebrew. No exclamation marks, no emoji, no filler.
Work only from the material given plus well-established knowledge. Never invent sources, quotes, statistics or rituals. Respect each culture: do not flatten it, rank it or exoticise it.

Task: a group of cultural concepts that belong together. Show the common denominator AND the individuality of each member.
Text standard: an insight line is up to 8 words and ends with a full stop; an explanation is ONE sentence, up to 20 words. Put 1-3 key terms in **double asterisks**. Mark at most one central insight with ==double equals== in the whole answer.
- insight: the group's common denominator, up to 8 words.
- explanation: one sentence that explains it.
- shared: exactly 3 traits the members share. trait - 2-5 words. evidence - one sentence naming the concepts that show it.
- members: one per concept given, same order. concept - ONLY the word before the parenthesis, copied exactly (e.g. "פיקה", not "פיקה (שוודיה; ...)"). unique - what only this member brings, up to 14 words, never a restatement of the shared traits.
- tension: the axis on which the members pull apart. axis - 2-4 words. poles - which concepts sit at each end. meaning - one sentence.
- language: one sentence, up to 24 words, on how the structure of the members' languages (given with each concept) echoes or contradicts the shared trait. Phrase it as a reading, not a proof. Empty string if no language data is given.
- action: one thing an architect or designer does with this group, up to 16 words.
- haiku: three short Hebrew lines, about 5-7-5 syllables, one concrete image from a city, nature or material. illuminates - one short line: what the haiku lights up.`;

const GEMINI_MODELS = [...new Set([Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash', 'gemini-flash-lite-latest'])];
const MIXED = /[֐-׿][Ѐ-ӿ؀-ۿ]|[Ѐ-ӿ؀-ۿ][֐-׿]/;

async function ask(key: string, user: string): Promise<Record<string, unknown>> {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
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
        signal: AbortSignal.timeout(45000),
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
  const status = (last as { status?: number })?.status;
  if (status === 429) return { error: 'המכסה החינמית של Gemini התמלאה לרגע. המתיני דקה ונסי שוב.' };
  return { error: 'Gemini עמוס כרגע. נסי שוב בעוד רגע.' };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!key) return json({ error: 'מפתח Gemini לא הוגדר בשרת.' }, 500);
    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) return json({ error: 'קוד הגישה שגוי.' }, 401);

    const b = (await req.json()) as { group?: string; by?: string; items?: Record<string, string>[] };
    const items = (b.items ?? []).slice(0, 30);
    if (!b.group || items.length < 2) return json({ error: 'קבוצה צריכה לפחות שני מושגים.' }, 400);
    const user = `הקבוצה: ${b.group} (קיבוץ לפי ${b.by})\n\nהמושגים:\n${items
      .map((i) => `- ${i.concept} (${i.culture}; "${i.literal}"; ${i.era}): ${i.insight}${i.language ? ` | שפה: ${i.language}` : ''}`)
      .join('\n')}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const beat = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000);
        controller.enqueue(encoder.encode(' '));
        let result = await ask(key, user);
        if (!result.error && MIXED.test(JSON.stringify(result))) result = await ask(key, `${user}\n\nIMPORTANT: Hebrew letters only in Hebrew text.`);
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
