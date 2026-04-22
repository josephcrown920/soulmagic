// Train a FLUX LoRA on Replicate using user-uploaded images.
// Workflow: client uploads images to lora-training bucket, then calls this fn.
// We zip the images, upload the zip to a public-readable signed URL, create a
// destination model on Replicate (if missing), kick off training, store the
// training id, then poll until ready.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ostris/flux-dev-lora-trainer
const TRAINER_VERSION = "26a1a203c69e2f0fb2143cc4b66a09f3c0936c93dab6e3d70a5c6e9b6a3d8e2f";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { loraId } = await req.json();
    if (!loraId) throw new Error("loraId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN not set");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: lora, error: loraErr } = await admin.from("loras").select("*").eq("id", loraId).single();
    if (loraErr || !lora) throw new Error(loraErr?.message ?? "LoRA not found");

    await admin.from("loras").update({ status: "training", progress: 5 }).eq("id", loraId);

    // Build a zip of all training images
    const paths: string[] = lora.training_image_paths ?? [];
    if (paths.length < 4) throw new Error("Need at least 4 training images");

    // Use JSZip via esm.sh
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

    const { data: signed, error: sErr } = await admin.storage
      .from("lora-training")
      .createSignedUrl(zipPath, 3600);
    if (sErr || !signed?.signedUrl) throw new Error(sErr?.message ?? "could not sign zip");

    await admin.from("loras").update({ progress: 15 }).eq("id", loraId);

    // Get authenticated Replicate user
    const meRes = await fetch("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    if (!meRes.ok) throw new Error(`Replicate auth failed: ${await meRes.text()}`);
    const me = await meRes.json();
    const owner = me.username;

    // Model name (must be unique per user account on Replicate)
    const safeName = (lora.name || "lora").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40) + "-" + loraId.slice(0, 8);

    // Create destination model if it doesn't exist
    await fetch("https://api.replicate.com/v1/models", {
      method: "POST",
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        owner,
        name: safeName,
        visibility: "private",
        hardware: "gpu-t4",
        description: `LoRA: ${lora.name}`,
      }),
    });

    // Kick off training
    const trainRes = await fetch(
      `https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/${TRAINER_VERSION}/trainings`,
      {
        method: "POST",
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: `${owner}/${safeName}`,
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

    if (!trainRes.ok) throw new Error(`Replicate training error: ${await trainRes.text()}`);
    const training = await trainRes.json();

    await admin.from("loras").update({
      replicate_training_id: training.id,
      replicate_model_owner: owner,
      replicate_model_name: safeName,
      progress: 25,
    }).eq("id", loraId);

    // Poll for completion (up to ~25 minutes)
    let final = training;
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 10000));
      const r = await fetch(`https://api.replicate.com/v1/trainings/${training.id}`, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      final = await r.json();
      const progress = Math.min(95, 25 + Math.round(((i + 1) / 150) * 70));
      await admin.from("loras").update({ progress }).eq("id", loraId);
      if (final.status === "succeeded" || final.status === "failed" || final.status === "canceled") break;
    }

    if (final.status !== "succeeded") {
      const msg = final.error ?? `Status: ${final.status}`;
      await admin.from("loras").update({ status: "failed", error_message: String(msg) }).eq("id", loraId);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Output is the trained model version
    const versionId = final.output?.version?.split(":")[1] ?? final.version;
    await admin.from("loras").update({
      status: "ready",
      progress: 100,
      replicate_version_id: versionId,
      weights_url: final.output?.weights ?? null,
      completed_at: new Date().toISOString(),
    }).eq("id", loraId);

    return new Response(JSON.stringify({ ok: true, versionId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("train-lora error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
