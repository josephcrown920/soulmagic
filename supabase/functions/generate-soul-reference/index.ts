import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { soulId, prompt, aspectRatio = "1:1", numOutputs = 1 } = await req.json();
    if (!soulId || !prompt) throw new Error("soulId and prompt are required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const falKey = Deno.env.get("FAL_KEY");
    if (!supabaseUrl || !serviceKey || !falKey) throw new Error("Reference Soul configuration is missing");

    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Unauthorized");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error("Soul not found");
    if (soul.user_id !== user.id) throw new Error("Forbidden");
    if (!Array.isArray(soul.reference_image_paths) || soul.reference_image_paths.length === 0) throw new Error("This Soul has no reference images yet");

    // V2 intentionally uses the strongest curated reference images rather than
    // a trained weight. The model endpoint can evolve independently of Soul storage.
    const referenceUrls: string[] = [];
    for (const path of soul.reference_image_paths.slice(0, 4)) {
      const { data, error: signError } = await admin.storage.from("soul-training").createSignedUrl(path, 60 * 15);
      if (signError || !data?.signedUrl) throw new Error("Could not access Soul reference image");
      referenceUrls.push(data.signedUrl);
    }

    // Keep the provider adapter isolated: replace this model here when the
    // selected reference-identity provider is enabled without changing Soul UI.
    const response = await fetch("https://fal.run/fal-ai/flux-2/image-to-image", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_url: referenceUrls[0],
        image_size: aspectRatio === "16:9" ? "landscape_16_9" : aspectRatio === "9:16" ? "portrait_16_9" : "square_hd",
        num_images: Math.min(Math.max(Number(numOutputs) || 1, 1), 4),
        strength: 0.18,
      }),
    });
    if (!response.ok) throw new Error(`Reference generation failed: ${await response.text()}`);
    const result = await response.json();
    return new Response(JSON.stringify({ ok: true, mode: "reference", soulId, referenceCount: referenceUrls.length, result }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
