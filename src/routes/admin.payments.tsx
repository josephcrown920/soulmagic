import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { approveCryptoPayment, rejectCryptoPayment } from "@/lib/crypto-billing.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Crypto payments — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPayments,
});

type Wallet = {
  id: string;
  network: string;
  coin: string;
  address: string;
  memo: string | null;
  label: string | null;
  is_active: boolean;
  sort_order: number;
};

type Payment = {
  id: string;
  user_id: string;
  plan_slug: string;
  coin: string | null;
  network: string | null;
  tx_hash: string | null;
  price_amount: number;
  status: string;
  created_at: string;
  admin_notes: string | null;
};

function AdminPayments() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const approve = useServerFn(approveCryptoPayment);
  const reject = useServerFn(rejectCryptoPayment);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user, loading, nav]);

  const loadAll = async () => {
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from("crypto_wallets").select("*").order("sort_order"),
      supabase.from("crypto_payments").select("id,user_id,plan_slug,coin,network,tx_hash,price_amount,status,created_at,admin_notes").order("created_at", { ascending: false }).limit(100),
    ]);
    setWallets((w ?? []) as Wallet[]);
    setPayments((p ?? []) as Payment[]);
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const updateWallet = async (id: string, patch: Partial<Wallet>) => {
    const { error } = await supabase.from("crypto_wallets").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    loadAll();
  };

  const addWallet = async () => {
    const { error } = await supabase.from("crypto_wallets").insert({
      network: "ethereum", coin: "USDC", address: "0x", label: "New wallet", is_active: false, sort_order: wallets.length + 1,
    });
    if (error) return toast.error(error.message);
    loadAll();
  };

  const deleteWallet = async (id: string) => {
    if (!confirm("Delete this wallet?")) return;
    await supabase.from("crypto_wallets").delete().eq("id", id);
    loadAll();
  };

  const onApprove = async (id: string) => {
    setBusy(id);
    try {
      const r = await approve({ data: { paymentId: id } });
      if ("error" in r) toast.error(r.error);
      else { toast.success("Approved & subscription activated"); loadAll(); }
    } finally { setBusy(null); }
  };

  const onReject = async (id: string) => {
    const note = prompt("Optional reason for rejection:") ?? undefined;
    setBusy(id);
    try {
      const r = await reject({ data: { paymentId: id, notes: note } });
      if ("error" in r) toast.error(r.error);
      else { toast.success("Rejected"); loadAll(); }
    } finally { setBusy(null); }
  };

  if (loading || isAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is for admins only.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-5 py-3 backdrop-blur md:px-12">
        <Link to="/" className="font-semibold tracking-tight">Soul · Admin</Link>
        <Link to="/settings" search={{}}><Button size="sm" variant="ghost">Settings</Button></Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 p-6">
        {/* Wallets */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Crypto wallets</h2>
            <Button size="sm" onClick={addWallet}><Plus className="mr-1 h-4 w-4" /> Add wallet</Button>
          </div>
          <div className="space-y-3">
            {wallets.map((w) => (
              <div key={w.id} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input defaultValue={w.label ?? ""} onBlur={(e) => e.target.value !== (w.label ?? "") && updateWallet(w.id, { label: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Coin</Label>
                      <Input defaultValue={w.coin} onBlur={(e) => e.target.value !== w.coin && updateWallet(w.id, { coin: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Network</Label>
                      <Input defaultValue={w.network} onBlur={(e) => e.target.value !== w.network && updateWallet(w.id, { network: e.target.value })} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Address</Label>
                    <Input className="font-mono text-xs" defaultValue={w.address} onBlur={(e) => e.target.value !== w.address && updateWallet(w.id, { address: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Memo / Tag (optional)</Label>
                    <Input defaultValue={w.memo ?? ""} onBlur={(e) => e.target.value !== (w.memo ?? "") && updateWallet(w.id, { memo: e.target.value || null })} />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={w.is_active} onCheckedChange={(v) => updateWallet(w.id, { is_active: v })} />
                      Active (visible to customers)
                    </label>
                    <Button size="icon" variant="ghost" onClick={() => deleteWallet(w.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {wallets.length === 0 && <p className="text-sm text-muted-foreground">No wallets yet. Click "Add wallet".</p>}
          </div>
        </section>

        {/* Payments */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Pending crypto payments</h2>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        p.status === "approved" ? "bg-green-500/15 text-green-500" :
                        p.status === "rejected" ? "bg-red-500/15 text-red-500" :
                        "bg-amber-500/15 text-amber-500"
                      }`}>{p.status}</span>
                      <span className="font-semibold">{p.plan_slug.toUpperCase()}</span>
                      <span className="text-muted-foreground">${p.price_amount} · {p.coin ?? "?"} on {p.network ?? "?"}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">User: {p.user_id}</div>
                    {p.tx_hash && (
                      <div className="break-all font-mono text-xs">
                        TX: <a className="text-primary underline" target="_blank" rel="noreferrer" href={`https://etherscan.io/tx/${p.tx_hash}`}>{p.tx_hash}</a>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                    {p.admin_notes && <div className="text-xs italic text-muted-foreground">Note: {p.admin_notes}</div>}
                  </div>
                  {p.status === "pending_review" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => onReject(p.id)}>
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button size="sm" disabled={busy === p.id} onClick={() => onApprove(p.id)} className="bg-gradient-primary text-primary-foreground">
                        {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" /> Approve</>}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
