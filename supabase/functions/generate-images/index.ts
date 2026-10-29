// CultureArch: draws an article's images and keeps them for good.
//
// Free engines only, the same ones faces-art uses in this project:
//   1. Cloudflare Workers AI, flux-1-schnell (free daily allowance; CF_ACCOUNT_ID
//      and CF_API_TOKEN as secrets, or in the private faces_secrets table).
//   2. Gemini image models, when the free key has image quota.
// Pollinations is not used: anonymously it serves a weaker model with a
// watermark, and once stored such an image would never be replaced.
// Images are square (1:1), like Anat's own prompts, and are stored in the
// article-media bucket; the article row points at the stored copy, never at
// the engine.
//
// The function reads the prompts from the article itself and only fills frames
// that are still empty, so a public caller cannot spend the allowance on
// anything but the library.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };
const BUCKET = 'article-media';
const TABLE = 'culture_articles';
const FRAMES = ['exterior', 'interior'] as const;
type Frame = (typeof FRAMES)[number];

const GEMINI_IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview'];

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...SB, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`DB ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : await r.json();
}

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Older prompts asked for 16:9; every image is square now. */
function squarePrompt(prompt: string): string {
  const p = prompt.replace(/\b16\s*:\s*9\b/g, '1:1').trim();
  return /\b1:1\b/.test(p) ? p : `${p}, 1:1 square composition`;
}

let cfCache: Record<string, string> | null = null;
async function cfKeys() {
  if (!cfCache) {
    cfCache = {};
    try {
      for (const r of await rest('faces_secrets?select=name,value&name=like.CF_*')) cfCache[r.name] = r.value;
    } catch {
      // No table or no rows: the env secrets are the only source.
    }
  }
  return {
    acct: Deno.env.get('CF_ACCOUNT_ID')?.trim() || cfCache.CF_ACCOUNT_ID,
    token: Deno.env.get('CF_API_TOKEN')?.trim() || cfCache.CF_API_TOKEN,
  };
}

type Rendered = { bytes: Uint8Array; type: string; engine: string };

async function viaCloudflare(prompt: string): Promise<Rendered> {
  const { acct, token } = await cfKeys();
  if (!acct || !token) throw new Error('cloudflare: no keys');
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 6 }),
    signal: AbortSignal.timeout(60000),
  });
  const d = await r.json().catch(() => null);
  const img = d?.result?.image;
  if (!r.ok || !img) throw new Error(`cloudflare ${r.status} ${JSON.stringify(d?.errors ?? d).slice(0, 160)}`);
  return { bytes: fromB64(img), type: 'image/jpeg', engine: 'cloudflare:flux-1-schnell' };
}

async function viaGemini(prompt: string): Promise<Rendered> {
  const key = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!key) throw new Error('gemini: no key');
  let last = '';
  for (const model of GEMINI_IMAGE_MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '1:1' } },
      }),
      signal: AbortSignal.timeout(60000),
    });
    const d = await r.json().catch(() => null);
    const part = d?.candidates?.[0]?.content?.parts?.find((p: Record<string, unknown>) => p.inline_data || p.inlineData);
    const inline = part?.inline_data ?? part?.inlineData;
    if (r.ok && inline?.data) {
      return { bytes: fromB64(inline.data), type: inline.mime_type ?? inline.mimeType ?? 'image/png', engine: `gemini:${model}` };
    }
    last += ` [${model} ${r.status}]`;
  }
  throw new Error(`gemini${last}`);
}

/**
 * Only the engines that meet the library's standard. When both are spent for
 * the day the frame stays empty and is filled on a later visit: a weaker image
 * stored for good would never be replaced.
 */
async function render(prompt: string): Promise<Rendered> {
  const errors: string[] = [];
  for (const engine of [viaCloudflare, viaGemini]) {
    try {
      return await engine(prompt);
    } catch (e) {
      errors.push(String(e instanceof Error ? e.message : e));
    }
  }
  throw new Error(errors.join(' | '));
}

async function store(articleId: string, frame: Frame, img: Rendered): Promise<string> {
  const ext = img.type.includes('png') ? 'png' : img.type.includes('webp') ? 'webp' : 'jpg';
  const path = `${articleId}/${frame}-image-${Date.now()}.${ext}`;
  const up = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...SB, 'Content-Type': img.type, 'Cache-Control': '31536000' },
    body: new Blob([img.bytes as BlobPart], { type: img.type }),
  });
  if (!up.ok) throw new Error(`upload ${up.status}`);
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** A stored copy is ours; a link to an engine is not, and gets replaced. */
const isStored = (url: unknown) => typeof url === 'string' && url.includes(`/storage/v1/object/public/`);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) {
      return json({ error: 'קוד הגישה שגוי.' }, 401);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.articleId ?? '').replace(/[^\w-]/g, '');
    if (!id) return json({ error: 'חסר מזהה מאמר.' }, 400);

    const [row] = await rest(`${TABLE}?id=eq.${id}&select=id,image_exterior,image_interior,exterior_prompt,interior_prompt`);
    if (!row) return json({ error: 'המאמר עוד לא נשמר בשרת.', retry: true }, 404);

    const wanted = (Array.isArray(body.frames) ? body.frames : FRAMES).filter((f): f is Frame =>
      (FRAMES as readonly string[]).includes(String(f)),
    );

    const result: Record<string, string | null> = { exterior: row.image_exterior, interior: row.image_interior };
    const engines: string[] = [];
    const errors: string[] = [];

    for (const frame of wanted) {
      if (isStored(row[`image_${frame}`])) continue;
      const prompt = String(row[`${frame}_prompt`] ?? '').trim();
      if (!prompt) continue;
      try {
        const img = await render(squarePrompt(prompt));
        const url = await store(id, frame, img);
        // Patch one column at a time, so a frame filled by hand meanwhile is never lost.
        const [current] = await rest(`${TABLE}?id=eq.${id}&select=image_${frame}`);
        if (!isStored(current?.[`image_${frame}`])) {
          await rest(`${TABLE}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ [`image_${frame}`]: url }) });
          result[frame] = url;
        } else {
          result[frame] = current[`image_${frame}`];
        }
        engines.push(img.engine);
      } catch (e) {
        errors.push(`${frame}: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (errors.length) console.error('generate-images', id, errors.join(' | '));
    return json({ ...result, engines, errors });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
