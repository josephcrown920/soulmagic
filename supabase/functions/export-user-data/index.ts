// Export user's generated images, job outputs, and LoRA artifacts as a ZIP
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { zip } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function safeName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

async function downloadToU8(
  client: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
): Promise<Uint8Array | null> {
  try {
    const { data, error } = await client.storage.from(bucket).download(path);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify user from JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service client for unrestricted storage downloads (RLS already verified user above)
    const admin = createClient(supabaseUrl, serviceKey);

    // Collect user records
    const [imagesRes, jobsRes, lorasRes] = await Promise.all([
      admin.from("generated_images").select("id,prompt,file_path,created_at").eq("user_id", userId),
      admin.from("jobs").select("id,source_filename,output_path,thumbnail_path,status,created_at").eq("user_id", userId),
      admin.from("loras").select("id,name,trigger_word,status,weights_url,preview_path,created_at").eq("user_id", userId),
    ]);

    const files: Record<string, Uint8Array> = {};
    const manifest: any = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      counts: {
        generated_images: imagesRes.data?.length ?? 0,
        jobs: jobsRes.data?.length ?? 0,
        loras: lorasRes.data?.length ?? 0,
      },
      generated_images: imagesRes.data ?? [],
      jobs: jobsRes.data ?? [],
      loras: lorasRes.data ?? [],
    };

    // Generated images
    for (const img of imagesRes.data ?? []) {
      if (!img.file_path) continue;
      const bytes = await downloadToU8(admin, "generated-images", img.file_path);
      if (bytes) {
        const ext = img.file_path.split(".").pop() || "png";
        files[`generated-images/${safeName(img.id)}.${ext}`] = bytes;
      }
    }

    // Job outputs (videos) + thumbnails
    for (const job of jobsRes.data ?? []) {
      if (job.output_path) {
        const bytes = await downloadToU8(admin, "videos-output", job.output_path);
        if (bytes) {
          const ext = job.output_path.split(".").pop() || "mp4";
          files[`jobs/${safeName(job.id)}/${safeName(job.source_filename || "output")}.${ext}`] = bytes;
        }
      }
      if (job.thumbnail_path) {
        const bytes = await downloadToU8(admin, "thumbnails", job.thumbnail_path);
        if (bytes) {
          files[`jobs/${safeName(job.id)}/thumbnail.jpg`] = bytes;
        }
      }
    }

    // LoRA preview images (weights are external URLs — referenced in manifest)
    for (const lora of lorasRes.data ?? []) {
      if (lora.preview_path) {
        const bytes = await downloadToU8(admin, "lora-training", lora.preview_path);
        if (bytes) {
          files[`loras/${safeName(lora.name || lora.id)}/preview.png`] = bytes;
        }
      }
    }

    files["manifest.json"] = new TextEncoder().encode(JSON.stringify(manifest, null, 2));
    files["README.txt"] = new TextEncoder().encode(
      `Soul export\nGenerated: ${new Date().toISOString()}\n\n` +
        `Contents:\n- generated-images/  Your AI-generated images\n` +
        `- jobs/                One folder per video job (output + thumbnail)\n` +
        `- loras/               LoRA preview images. Trained model weights are stored externally; URLs are listed in manifest.json.\n` +
        `- manifest.json        Full database records for everything above.\n`,
    );

    const zipped: Uint8Array = await new Promise((resolve, reject) => {
      zip(files, { level: 6 }, (err, data) => (err ? reject(err) : resolve(data)));
    });

    const filename = `soul-export-${new Date().toISOString().slice(0, 10)}.zip`;
    return new Response(zipped, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipped.byteLength),
      },
    });
  } catch (e) {
    console.error("export-user-data error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
