// CultureArch: renders the two image prompts Claude wrote.
//
// Optional. Without FAL_API_KEY set in the Edge Function secrets, articles are
// generated without images and the prompts stay available to copy.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-passcode',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function render(prompt: string, key: string): Promise<string> {
  const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: { width: 1280, height: 720 } }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'מפתח התמונות נדחה.'
        : `שגיאה ביצירת תמונה (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  const data = await response.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error('שירות התמונות לא החזיר תמונה.');
  return url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get('FAL_API_KEY');
    if (!key) {
      return json({ error: 'מפתח תמונות לא הוגדר בשרת (FAL_API_KEY).' }, 500);
    }

    const passcode = Deno.env.get('APP_PASSCODE');
    if (passcode && req.headers.get('x-app-passcode') !== passcode) {
      return json({ error: 'קוד הגישה שגוי.' }, 401);
    }

    const { exteriorPrompt, interiorPrompt } = await req.json();
    if (!exteriorPrompt || !interiorPrompt) {
      return json({ error: 'חסרים פרומפטים לתמונות.' }, 400);
    }

    const [exterior, interior] = await Promise.all([
      render(exteriorPrompt, key),
      render(interiorPrompt, key),
    ]);

    return json({ exterior, interior });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
