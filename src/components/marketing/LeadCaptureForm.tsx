import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LeadCaptureForm({
  source = "landing",
  cta = "Get early access",
  placeholder = "you@studio.com",
  helper = "Join the waitlist — be first to train your Soul.",
}: {
  source?: string;
  cta?: string;
  placeholder?: string;
  helper?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("leads").insert({ email, source });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw error;
      }
      setDone(true);
      toast.success("You're on the list. Watch your inbox.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm">
        <p className="font-medium text-foreground">You're in.</p>
        <p className="mt-1 text-muted-foreground">
          Check <span className="text-foreground">{email}</span> for your
          welcome note and next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="h-11 flex-1"
        />
        <Button
          type="submit"
          disabled={busy}
          className="h-11 bg-gradient-primary px-6 text-primary-foreground"
        >
          {busy ? "…" : cta}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </form>
  );
}
