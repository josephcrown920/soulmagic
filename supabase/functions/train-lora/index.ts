// Train a FLUX LoRA on Replicate using user-uploaded images.
// Workflow: client uploads images to lora-training bucket, then calls this fn.
// We zip the images, sign a temporary URL, look up the latest trainer version,
// create a destination model on Replicate (if missing), and kick off training
// with a webhook callback. We DO NOT poll synchronously — the webhook
// (`/api/public/hooks/replicate-training`) updates the row when training
// completes. Users can also pull a manual status update via `sync-lora-status`.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dynamically discover the latest version of the trainer model so we never
// ship with a stale or wrong hash.
async function getLatestTrainerVersion(token: string): Promise<string> {
  const r = await fetch(
    "https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer",
    { headers: { Authorization: `Token ${token}` } },
  );
  if (!r.ok) throw new Error(`Replicate model lookup failed: ${await r.text()}`);
  const j = await r.json();
  const id = j?.latest_version?.id;
  if (!id) throw new Error("Could not resolve latest trainer version");
  return id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { loraId } = await req.json();
    if (!loraId) throw new Error("loraId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    // Public app URL the webhook will call back to. Falls back to the Lovable
    // project URL if the optional secret isn't set.
    const APP_URL = Deno.env.get("APP_URL")
      ?? "https://project--1d7ae0ee-b549-4184-908f-8a647c314c6d.lovable.app";
    if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: lora, error: loraErr } = await admin
      .from("loras").select("*").eq("id", loraId).single();
    if (loraErr || !lora) throw new Error(loraErr?.message ?? "LoRA not found");

    await admin.from("loras")
      .update({ status: "training", progress: 5, error_message: null })
      .eq("id", loraId);

    const paths: string[] = lora.training_image_paths ?? [];
    if (paths.length < 4) throw new Error("Need at least 4 training images");

    // Zip training images
    const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
    const zip = new JSZip();
    for (const p of paths) {
      const { data: blob, error } = await admin.storage.from("lora-training").download(p);
      if (error || !blob) throw new Error(`download ${p}: ${error?.message}`);
      const buf = await blob.arrayBuffer();
      const filename = p.split("/").pop() ?? "image.jpg";
      zip.file(filename, buf);
    }
    const zipBuf: Uint8Array = await zip.generateAsync({ type: "uint8array" });
    const zipPath = `${lora.user_id}/${loraId}/training.zip`;
    const { error: upErr } = await admin.storage
      .from("lora-training")
      .upload(zipPath, zipBuf, { upsert: true, contentType: "application/zip" });
    if (upErr) throw upErr;

    // 6 hours — well over training duration so Replicate can fetch it whenever.
    const { data: signed, error: sErr } = await admin.storage
      .from("lora-training")
      .createSignedUrl(zipPath, 60 * 60 * 6);
    if (sErr || !signed?.signedUrl) throw new Error(sErr?.message ?? "could not sign zip");

    await admin.from("loras").update({ progress: 15 }).eq("id", loraId);

    // Resolve Replicate account + latest trainer version
    const [meRes, trainerVersion] = await Promise.all([
      fetch("https://api.replicate.com/v1/account", {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      }),
      getLatestTrainerVersion(REPLICATE_API_TOKEN),
    ]);
    if (!meRes.ok) throw new Error(`Replicate auth failed: ${await meRes.text()}`);
    const me = await meRes.json();
    const owner = me.username;

    const safeName = (lora.name || "lora")
      .toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40)
      + "-" + loraId.slice(0, 8);

    // Create destination model — ignore 409 (already exists)
    const createRes = await fetch("https://api.replicate.com/v1/models", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner,
        name: safeName,
        visibility: "private",
        hardware: "gpu-t4",
        description: `LoRA: ${lora.name}`,
      }),
    });
    if (!createRes.ok && createRes.status !== 409 && createRes.status !== 422) {
      const t = await createRes.text();
      console.warn(`Replicate model create non-OK (${createRes.status}): ${t}`);
    }

    const webhookUrl = `${APP_URL}/api/public/hooks/replicate-training?loraId=${loraId}`;

    const trainRes = await fetch(
      `https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/${trainerVersion}/trainings`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: `${owner}/${safeName}`,
          webhook: webhookUrl,
          webhook_events_filter: ["completed"],
          input: {
            input_images: signed.signedUrl,
            steps: lora.training_steps ?? 1000,
            trigger_word: lora.trigger_word ?? "TOK",
            lora_rank: 16,
            optimizer: "adamw8bit",
            batch_size: 1,
            resolution: "512,768,1024",
            autocaption: true,
            learning_rate: 0.0004,
          },
        }),
      },
    );

    if (!trainRes.ok) {
      const errText = await trainRes.text();
      await admin.from("loras")
        .update({ status: "failed", error_message: `Replicate: ${errText}` })
        .eq("id", loraId);
      throw new Error(`Replicate training error: ${errText}`);
    }

    const training = await trainRes.json();

    await admin.from("loras").update({
      replicate_training_id: training.id,
      replicate_model_owner: owner,
      replicate_model_name: safeName,
      progress: 25,
    }).eq("id", loraId);

    // Return immediately — webhook will finish the job.
    return new Response(
      JSON.stringify({ ok: true, trainingId: training.id, status: "training" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("train-lora error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
