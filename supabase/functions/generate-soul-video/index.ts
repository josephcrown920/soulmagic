import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { soulId, prompt, duration = 10, aspectRatio = "16:9", referenceVideoUrl, audioUrl } = await req.json();
    if (!soulId || !prompt) throw new Error("soulId and prompt are required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const seedanceUrl = Deno.env.get("SEEDANCE_API_URL");
    const seedanceKey = Deno.env.get("SEEDANCE_API_KEY");
    const seedanceModel = Deno.env.get("SEEDANCE_MODEL") || "seedance-2.5";
    if (!supabaseUrl || !serviceKey || !seedanceUrl || !seedanceKey) throw new Error("Seedance configuration is missing");

    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Unauthorized");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error("Soul not found");
    if (soul.user_id !== user.id) throw new Error("Forbidden");
    if (soul.status !== "ready") throw new Error("Soul is not ready yet");

    const referencePaths = Array.isArray(soul.reference_image_paths) && soul.reference_image_paths.length
      ? soul.reference_image_paths.slice(0, 8)
      : soul.training_image_paths.slice(0, 8);
    const references: string[] = [];
    for (const path of referencePaths) {
      const { data, error: signError } = await admin.storage.from("soul-training").createSignedUrl(path, 15 * 60);
      if (signError || !data?.signedUrl) throw new Error("Could not access Soul reference image");
      references.push(data.signedUrl);
    }

    // Provider-neutral request envelope. The adapter keeps Seedance credentials
    // server-side and lets the configured gateway map fields to its exact API.
    const body: Record<string, unknown> = {
      model: seedanceModel,
      prompt: `Use the supplied Soul references to preserve the artist's identity. ${prompt}`,
      duration: Math.min(Math.max(Number(duration) || 10, 5), 30),
      aspect_ratio: aspectRatio,
      images: references,
    };
    if (referenceVideoUrl) body.videos = [referenceVideoUrl];
    if (audioUrl) body.audios = [audioUrl];

    const response = await fetch(seedanceUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${seedanceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Seedance request failed: ${await response.text()}`);
    const result = await response.json();

    return new Response(JSON.stringify({ ok: true, provider: "seedance", model: seedanceModel, soulId, referenceCount: references.length, result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-soul-video", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
