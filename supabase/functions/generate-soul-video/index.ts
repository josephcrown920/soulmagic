import "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  let admin: ReturnType<typeof createClient> | null = null;
  let jobId: string | null = null;
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) throw new Error("Supabase anonymous key is missing");
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    admin = createClient(supabaseUrl, serviceKey);
    const { data: soul, error } = await admin.from("souls").select("*").eq("id", soulId).single();
    if (error || !soul) throw new Error("Soul not found");
    if (soul.user_id !== user.id) throw new Error("Forbidden");
    if (soul.status !== "ready") throw new Error("Soul is not ready yet");

    const safeDuration = Math.min(Math.max(Number(duration) || 10, 5), 30);
    const referencePaths = Array.isArray(soul.reference_image_paths) && soul.reference_image_paths.length
      ? soul.reference_image_paths.slice(0, 8)
      : soul.training_image_paths.slice(0, 8);
    const references: string[] = [];
    for (const path of referencePaths) {
      const { data, error: signError } = await admin.storage.from("soul-training").createSignedUrl(path, 15 * 60);
      if (signError || !data?.signedUrl) throw new Error("Could not access Soul reference image");
      references.push(data.signedUrl);
    }

    const { data: job, error: jobError } = await admin.from("soul_video_jobs").insert({
      user_id: user.id,
      soul_id: soulId,
      provider: "seedance",
      model: seedanceModel,
      status: "queued",
      prompt,
      duration: safeDuration,
      aspect_ratio: aspectRatio,
      reference_count: references.length,
    }).select("id").single();
    if (jobError || !job) throw jobError ?? new Error("Could not create video job");
    jobId = job.id;

    await admin.from("soul_video_jobs").update({ status: "processing" }).eq("id", jobId);

    const body: Record<string, unknown> = {
      model: seedanceModel,
      prompt: `Use the supplied Soul references to preserve the artist's identity. ${prompt}`,
      duration: safeDuration,
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
    const providerJobId = result?.id ?? result?.job_id ?? result?.request_id ?? null;
    const outputUrl = result?.video?.url ?? result?.video_url ?? result?.output?.url ?? null;
    const nextStatus = outputUrl ? "completed" : "processing";

    await admin.from("soul_video_jobs").update({
      status: nextStatus,
      provider_job_id: providerJobId,
      output_url: outputUrl,
      metadata: result,
    }).eq("id", jobId);

    return new Response(JSON.stringify({ ok: true, jobId, provider: "seedance", model: seedanceModel, soulId, referenceCount: references.length, status: nextStatus, result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (admin && jobId) {
      await admin.from("soul_video_jobs").update({ status: "failed", error_message: e instanceof Error ? e.message : "Unknown error" }).eq("id", jobId);
    }
    console.error("generate-soul-video", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", jobId }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
