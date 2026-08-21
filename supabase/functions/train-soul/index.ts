import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { soulId } = await req.json();
    if (!soulId) throw new Error("soulId required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const falKey = Deno.env.get("FAL_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing");
    if (!falKey) throw new Error("FAL_KEY not set");

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error(error?.message ?? "Soul not found");
    if (!Array.isArray(soul.training_image_paths) || soul.training_image_paths.length < 10) throw new Error("Aurora Soul requires at least 10 photos");

    await admin.from("souls").update({ status: "training", progress: 10, error_message: null }).eq("id", soulId);

    const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
    const zip = new JSZip();
    for (const path of soul.training_image_paths) {
      const { data: blob, error: downloadError } = await admin.storage.from("soul-training").download(path);
      if (downloadError || !blob) throw new Error(`Could not read training photo: ${downloadError?.message ?? path}`);
      zip.file(path.split("/").pop() ?? crypto.randomUUID(), await blob.arrayBuffer());
    }
    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    const zipPath = `${soul.user_id}/${soulId}/training.zip`;
    const { error: uploadError } = await admin.storage.from("soul-training").upload(zipPath, zipBytes, { upsert: true, contentType: "application/zip" });
    if (uploadError) throw uploadError;
    const { data: signed, error: signError } = await admin.storage.from("soul-training").createSignedUrl(zipPath, 60 * 60 * 6);
    if (signError || !signed?.signedUrl) throw new Error(signError?.message ?? "Could not sign training dataset");

    await admin.from("souls").update({ progress: 25 }).eq("id", soulId);
    const webhookUrl = `${supabaseUrl}/functions/v1/fal-soul-webhook?soulId=${encodeURIComponent(soulId)}`;
    const submit = await fetch("https://queue.fal.run/fal-ai/flux-lora-portrait-trainer", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        input_images: signed.signedUrl,
        trigger_word: soul.trigger_phrase || "aurorasoul",
        steps: 1800,
        lora_rank: 32,
        learning_rate: 0.0003,
        autocaption: true,
        resolution: "768,1024",
        webhook_url: webhookUrl,
      }),
    });
    if (!submit.ok) throw new Error(`fal training submission failed: ${await submit.text()}`);
    const result = await submit.json();
    const requestId = result?.request_id ?? result?.id;
    if (!requestId) throw new Error("fal did not return a training request id");
    await admin.from("souls").update({ training_request_id: requestId, progress: 30 }).eq("id", soulId);

    return new Response(JSON.stringify({ ok: true, requestId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("train-soul error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
