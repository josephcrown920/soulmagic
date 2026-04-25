import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { submitCryptoPayment } from "@/lib/crypto-billing.functions";
import { toast } from "sonner";

type Wallet = {
  id: string;
  network: string;
  coin: string;
  address: string;
  memo: string | null;
  label: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planSlug: "pro" | "studio";
  planName: string;
  priceUsd: string;
};

export function CryptoPayDialog({ open, onOpenChange, planSlug, planName, priceUsd }: Props) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = useServerFn(submitCryptoPayment);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("crypto_wallets")
        .select("id,network,coin,address,memo,label")
        .eq("is_active", true)
        .order("sort_order");
      const list = (data ?? []) as Wallet[];
      setWallets(list);
      if (list[0]) setSelected(list[0].id);
    })();
  }, [open]);

  const wallet = wallets.find((w) => w.id === selected);

  const copy = async (text: string, label = "Address") => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const onSubmit = async () => {
    if (!wallet) return;
    if (txHash.trim().length < 10) {
      toast.error("Paste a valid transaction hash");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          planSlug,
          walletId: wallet.id,
          txHash: txHash.trim(),
          coin: wallet.coin,
          network: wallet.network,
        },
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Submitted! We'll verify and activate your plan within a few hours.");
      setTxHash("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay with crypto · {planName}</DialogTitle>
          <DialogDescription>
            Send <strong>{priceUsd}</strong> in USDC or USDT (Ethereum) to one of the addresses below, then paste your transaction hash.
          </DialogDescription>
        </DialogHeader>

        {wallets.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            No wallet addresses are available right now. Please try again later.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selected === w.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w.coin} · {w.network}
                </button>
              ))}
            </div>

            {wallet && (
              <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
                <div className="text-xs text-muted-foreground">{wallet.label ?? `${wallet.coin} (${wallet.network})`}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-md bg-muted/50 px-2 py-1.5 text-xs">{wallet.address}</code>
                  <Button size="icon" variant="ghost" onClick={() => copy(wallet.address)} aria-label="Copy address">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {wallet.memo && (
                  <div className="text-xs text-amber-500">
                    Memo/Tag required: <code className="rounded bg-muted/50 px-1">{wallet.memo}</code>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tx">Transaction hash</Label>
              <Input
                id="tx"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x… (paste from your wallet/exchange after sending)"
                className="font-mono text-xs"
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                We verify the transaction on-chain before activating your plan. Usually within a few hours.
              </p>
            </div>

            <Button onClick={onSubmit} disabled={busy || !wallet} className="w-full bg-gradient-primary text-primary-foreground shadow-elegant">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Submit payment for review"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
