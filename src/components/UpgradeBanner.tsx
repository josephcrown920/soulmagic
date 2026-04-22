import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/lib/use-plan";

type Props = {
  kind: "jobs" | "loras" | "images";
  label?: string;
};

export function UpgradeBanner({ kind, label }: Props) {
  const { plan, usage, remaining, loading } = usePlan();
  if (loading || !plan) return null;
  if (plan.slug === "studio") return null;

  const used =
    kind === "jobs" ? usage.jobs_processed :
    kind === "loras" ? usage.loras_trained :
    usage.images_generated;
  const total =
    kind === "jobs" ? plan.monthly_jobs :
    kind === "loras" ? plan.monthly_loras :
    plan.monthly_images;
  const left = remaining(kind);
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 100;

  if (left > Math.max(2, total * 0.25)) return null;

  const atLimit = left <= 0;
  const niceLabel = label ?? (kind === "jobs" ? "video jobs" : kind === "loras" ? "LoRA trainings" : "image generations");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/20 p-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold">
            {atLimit ? `You've used all your ${niceLabel} this month` : `${left} ${niceLabel} left this month`}
          </div>
          <div className="text-xs text-muted-foreground">
            On the <span className="text-foreground">{plan.name}</span> plan ({used}/{total} used · {pct}%). Upgrade for more.
          </div>
        </div>
      </div>
      <Link to="/pricing">
        <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-elegant">
          Upgrade <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}
