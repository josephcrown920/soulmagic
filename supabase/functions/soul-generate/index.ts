import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { soulId, prompt, image_size = "square_hd", num_images = 1 } = await req.json();
    if (!soulId || !prompt) throw new Error("soulId and prompt are required");

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const falKey = Deno.env.get("FAL_KEY");
    if (!url || !serviceKey || !falKey) throw new Error("Soul generation configuration is missing");

    const admin = createClient(url, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error("Soul not found");
    if (soul.status !== "ready" || !soul.lora_url) throw new Error("Soul is not ready yet");

    const finalPrompt = `${prompt}, ${soul.trigger_phrase}`;
    const response = await fetch("https://fal.run/fal-ai/flux-2/lora", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        image_size,
        num_images,
        loras: [{ path: soul.lora_url, scale: 1.0 }],
      }),
    });

    if (!response.ok) throw new Error(`fal generation failed: ${await response.text()}`);
    const result = await response.json();

    return new Response(JSON.stringify({ ok: true, soulId, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
