// Process a queued video on Replicate (GFPGAN / CodeFormer face restoration).
// Called manually from the client; for full automation a cron/worker would invoke this on schedule.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Replicate model versions (face restoration / upscaling).
const MODEL_VERSIONS: Record<string, string> = {
  // GFPGAN (tencentarc/gfpgan) — face restoration
  gfpgan: "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  // CodeFormer (sczhou/codeformer)
  codeformer: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!REPLICATE_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "REPLICATE_API_TOKEN not configured. Add it in project secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch job + preset
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("*, preset:presets(*)")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) throw new Error(jobErr?.message ?? "Job not found");

    // Mark processing
    await admin.from("jobs").update({ status: "processing", progress: 5 }).eq("id", jobId);

    // Sign input URL for Replicate to fetch
    const { data: signed, error: sErr } = await admin.storage
      .from("videos-input")
      .createSignedUrl(job.input_path, 3600);
    if (sErr || !signed?.signedUrl) throw new Error(sErr?.message ?? "Could not sign input URL");

    const preset = job.preset;
    const faceModel = preset?.face_model ?? "gfpgan";
    const version = MODEL_VERSIONS[faceModel] ?? MODEL_VERSIONS.gfpgan;

    // Build inputs (model-specific)
    const input: Record<string, unknown> = { img: signed.signedUrl };
    if (faceModel === "gfpgan") {
      input.version = "v1.4";
      input.scale = preset?.background_upscale ? 2 : 1;
    } else {
      input.codeformer_fidelity = preset?.face_strength ?? 0.7;
      input.background_enhance = preset?.background_upscale ?? false;
      input.face_upsample = true;
      input.upscale = preset?.background_upscale ? 2 : 1;
    }

    // Create prediction
    const predRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version, input }),
    });

    if (!predRes.ok) {
      const txt = await predRes.text();
      throw new Error(`Replicate ${predRes.status}: ${txt}`);
    }

    const pred = await predRes.json();
    await admin.from("jobs").update({
      replicate_prediction_id: pred.id,
      progress: 15,
      preset_snapshot: preset,
    }).eq("id", jobId);

    // Poll for completion (up to ~5 min)
    let final = pred;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const r = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      final = await r.json();
      const progress = Math.min(90, 15 + Math.round(((i + 1) / 60) * 75));
      await admin.from("jobs").update({ progress }).eq("id", jobId);
      if (final.status === "succeeded" || final.status === "failed" || final.status === "canceled") break;
    }

    if (final.status !== "succeeded") {
      const msg = final.error ?? `Status: ${final.status}`;
      await admin.from("jobs").update({
        status: "failed",
        error_message: String(msg),
      }).eq("id", jobId);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download output and upload to videos-output bucket
    const outputUrl: string = Array.isArray(final.output) ? final.output[0] : final.output;
    if (!outputUrl) throw new Error("No output URL from Replicate");

    const outRes = await fetch(outputUrl);
    if (!outRes.ok) throw new Error("Failed to download output");
    const blob = await outRes.blob();

    const ext = outputUrl.split(".").pop()?.split("?")[0] ?? "mp4";
    const outPath = `${job.user_id}/${jobId}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("videos-output")
      .upload(outPath, blob, { upsert: true, contentType: blob.type || "video/mp4" });
    if (upErr) throw upErr;

    await admin.from("jobs").update({
      status: "done",
      progress: 100,
      output_path: outPath,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    return new Response(JSON.stringify({ ok: true, outPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
