import "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { soulId, prompt, aspectRatio = "1:1", numOutputs = 1 } = await req.json();
    if (!soulId || !prompt) throw new Error("soulId and prompt required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const falKey = Deno.env.get("FAL_KEY");
    if (!supabaseUrl || !serviceKey || !falKey) throw new Error("Soul generation configuration is missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error("Soul not found");
    if (soul.user_id !== user.id) throw new Error("Forbidden");
    if (soul.status !== "ready" || !soul.lora_url) throw new Error("Soul is not ready yet");

    const sizeMap: Record<string, string> = { "1:1": "square_hd", "4:5": "portrait_4_3", "3:4": "portrait_4_3", "9:16": "portrait_16_9", "16:9": "landscape_16_9", "3:2": "landscape_4_3" };
    const n = Math.min(Math.max(Number(numOutputs) || 1, 1), 4);
    const fullPrompt = `${soul.trigger_phrase}, ${prompt}`;
    const response = await fetch("https://fal.run/fal-ai/flux-2/lora", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fullPrompt, image_size: sizeMap[aspectRatio] ?? "square_hd", num_images: n, loras: [{ path: soul.lora_url, scale: 1.0 }] }),
    });
    if (!response.ok) throw new Error(`fal generation failed: ${await response.text()}`);
    const result = await response.json();
    const outputs = Array.isArray(result?.images) ? result.images.map((x: { url?: string }) => x.url).filter(Boolean) : [];
    if (!outputs.length) throw new Error("No output image");

    const images: unknown[] = [];
    for (const imageUrl of outputs) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Could not download generated image");
      const blob = await imgRes.blob();
      const filePath = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await admin.storage.from("generated-images").upload(filePath, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: row, error: insertError } = await admin.from("generated_images").insert({ user_id: user.id, lora_id: null, prompt, file_path: filePath }).select().single();
      if (insertError) throw insertError;
      images.push(row);
    }
    return new Response(JSON.stringify({ ok: true, soulId, images, image: images[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-soul-image error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
