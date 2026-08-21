import "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId is required");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Supabase configuration is missing");
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Unauthorized");

    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: job, error } = await client.from("soul_video_jobs")
      .select("id, soul_id, provider, model, provider_job_id, status, prompt, duration, aspect_ratio, reference_count, output_url, error_message, metadata, created_at, updated_at")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();
    if (error || !job) throw new Error("Video job not found");

    return new Response(JSON.stringify({ ok: true, job }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
