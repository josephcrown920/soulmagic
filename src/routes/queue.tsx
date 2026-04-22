import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, X, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/queue")({
  component: () => (
    <RequireAuth>
      <Queue />
    </RequireAuth>
  ),
});

type Job = {
  id: string;
  source_filename: string;
  status: string;
  progress: number | null;
  created_at: string;
  error_message: string | null;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  processing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  done: <CheckCircle2 className="h-4 w-4 text-success" />,
  failed: <AlertCircle className="h-4 w-4 text-destructive" />,
  cancelled: <X className="h-4 w-4 text-muted-foreground" />,
};

function Queue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;
    load();
    // realtime subscription
    const channel = supabase
      .channel("jobs-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    const interval = setInterval(load, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id,source_filename,status,progress,created_at,error_message")
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
  };

  const cancel = async (id: string) => {
    await supabase.from("jobs").update({ status: "cancelled" }).eq("id", id);
    toast.success("Job cancelled");
  };

  const retry = async (id: string) => {
    await supabase.from("jobs").update({ status: "pending", progress: 0, error_message: null }).eq("id", id);
    toast.success("Retrying");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Queue</h1>
        <p className="text-sm text-muted-foreground">Live status of every job.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Nothing in the queue.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div>{STATUS_ICON[j.status] ?? <Clock className="h-4 w-4" />}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{j.source_filename}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs capitalize text-muted-foreground">{j.status}</span>
                  {(j.status === "processing" || j.status === "uploading") && (
                    <Progress value={Number(j.progress) || 0} className="h-1 w-40" />
                  )}
                </div>
                {j.error_message && (
                  <div className="mt-1 text-xs text-destructive">{j.error_message}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(j.status === "pending" || j.status === "processing") && (
                  <Button size="sm" variant="ghost" onClick={() => cancel(j.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {(j.status === "failed" || j.status === "cancelled") && (
                  <Button size="sm" variant="ghost" onClick={() => retry(j.id)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
