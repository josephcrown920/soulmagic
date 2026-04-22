// Cron-driven worker: claims pending jobs and kicks off processing.
// Called by pg_cron every minute. No auth required; safe because it only
// operates on jobs in the 'pending' state and uses the service-role client
// internally (via the process-video edge function).
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// How many jobs to claim per cron tick. Each claimed job triggers a
// fire-and-forget invocation of the process-video edge function.
const BATCH_SIZE = 3;

export const Route = createFileRoute("/api/public/hooks/process-queue")({
  server: {
    handlers: {
      POST: async () => {
        if (!SUPABASE_URL || !SERVICE_KEY) {
          return Response.json(
            { error: "Backend not configured" },
            { status: 500 },
          );
        }

        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1. Reap stale 'processing' jobs (>15 min, likely dead) so retries work.
        const staleCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        await admin
          .from("jobs")
          .update({
            status: "failed",
            error_message: "Timed out — worker did not finish in 15 minutes.",
          })
          .eq("status", "processing")
          .lt("updated_at", staleCutoff);

        // 2. Pick up to BATCH_SIZE pending jobs (FIFO).
        const { data: pending, error: pErr } = await admin
          .from("jobs")
          .select("id")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(BATCH_SIZE);

        if (pErr) {
          console.error("process-queue: fetch pending failed", pErr);
          return Response.json({ error: pErr.message }, { status: 500 });
        }

        if (!pending || pending.length === 0) {
          return Response.json({ ok: true, claimed: 0 });
        }

        // 3. Atomically claim them by flipping pending -> uploading.
        // The .eq("status","pending") guard prevents double-claims if two
        // cron ticks race.
        const ids = pending.map((j) => j.id);
        const { data: claimed, error: cErr } = await admin
          .from("jobs")
          .update({ status: "uploading", progress: 1 })
          .in("id", ids)
          .eq("status", "pending")
          .select("id");

        if (cErr) {
          console.error("process-queue: claim failed", cErr);
          return Response.json({ error: cErr.message }, { status: 500 });
        }

        // 4. Fire-and-forget the existing edge function for each claimed job.
        const claimedIds = (claimed ?? []).map((j) => j.id);
        const fnUrl = `${SUPABASE_URL}/functions/v1/process-video`;
        await Promise.all(
          claimedIds.map((jobId) =>
            fetch(fnUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SERVICE_KEY}`,
              },
              body: JSON.stringify({ jobId }),
            }).catch((e) => {
              console.error(`process-queue: kickoff ${jobId} failed`, e);
            }),
          ),
        );

        return Response.json({ ok: true, claimed: claimedIds.length, ids: claimedIds });
      },
    },
  },
});
