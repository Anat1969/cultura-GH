const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CultureArch: only change from MathArch is the 16:9 frame (was 1024x768).
async function generateImage(prompt: string, falKey: string): Promise<string> {
  const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: 1280, height: 720 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Fal.ai error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const imageUrl = data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Fal.ai לא החזיר תמונה');
  }
  return imageUrl;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get('ACCESS_NANO_BANANA_API');
    if (!FAL_KEY) {
      throw new Error('ACCESS_NANO_BANANA_API is not configured');
    }

    const { exteriorPrompt, interiorPrompt } = await req.json();
    if (!exteriorPrompt || !interiorPrompt) {
      return new Response(JSON.stringify({ error: 'Both prompts are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [exterior, interior] = await Promise.all([
      generateImage(exteriorPrompt, FAL_KEY),
      generateImage(interiorPrompt, FAL_KEY),
    ]);

    return new Response(JSON.stringify({ exterior, interior }), {
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
