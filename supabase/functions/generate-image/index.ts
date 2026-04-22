// Run FLUX inference on Replicate using a user's trained LoRA.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { loraId, prompt, aspectRatio = "1:1" } = await req.json();
    if (!loraId || !prompt) throw new Error("loraId and prompt required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: lora, error: lErr } = await admin.from("loras").select("*").eq("id", loraId).single();
    if (lErr || !lora) throw new Error("LoRA not found");
    if (lora.user_id !== user.id) throw new Error("Forbidden");
    if (lora.status !== "ready" || !lora.replicate_version_id) throw new Error("LoRA not ready");

    const fullPrompt = lora.trigger_word ? `${lora.trigger_word}, ${prompt}` : prompt;

    // Run inference using the trained model version
    const predRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: lora.replicate_version_id,
        input: {
          prompt: fullPrompt,
          aspect_ratio: aspectRatio,
          num_outputs: 1,
          output_format: "jpg",
          output_quality: 90,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          lora_scale: 1.0,
        },
      }),
    });

    if (!predRes.ok) throw new Error(`Replicate error: ${await predRes.text()}`);
    let pred = await predRes.json();

    for (let i = 0; i < 60; i++) {
      if (pred.status === "succeeded" || pred.status === "failed") break;
      await new Promise((r) => setTimeout(r, 2000));
      const r = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      pred = await r.json();
    }

    if (pred.status !== "succeeded") throw new Error(pred.error ?? "Generation failed");

    const imageUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    if (!imageUrl) throw new Error("No output image");

    const imgRes = await fetch(imageUrl);
    const imgBlob = await imgRes.blob();
    const filePath = `${user.id}/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await admin.storage
      .from("generated-images")
      .upload(filePath, imgBlob, { contentType: "image/jpeg" });
    if (upErr) throw upErr;

    const { data: row, error: insErr } = await admin
      .from("generated_images")
      .insert({ user_id: user.id, lora_id: loraId, prompt, file_path: filePath })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, image: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
