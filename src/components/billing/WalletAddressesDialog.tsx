import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Wallet, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
};

const NETWORK_BADGES: Record<string, { bg: string; text: string }> = {
  ethereum: { bg: "bg-indigo-500/15", text: "text-indigo-400" },
  tron:     { bg: "bg-red-500/15",    text: "text-red-400" },
  solana:   { bg: "bg-purple-500/15", text: "text-purple-400" },
};

function explorerUrl(network: string, address: string) {
  switch (network) {
    case "ethereum": return `https://etherscan.io/address/${address}`;
    case "tron":     return `https://tronscan.org/#/address/${address}`;
    case "solana":   return `https://solscan.io/account/${address}`;
    default:         return null;
  }
}

export function WalletAddressesDialog({ open, onOpenChange }: Props) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      if (list[0]) setSelectedId(list[0].id);
    })();
  }, [open]);

  const wallet = wallets.find((w) => w.id === selectedId);

  const copy = async (text: string, label = "Address") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Send crypto
          </DialogTitle>
          <DialogDescription>
            Send to any of these addresses. Always double-check the network before sending — sending on the wrong chain may lose your funds.
          </DialogDescription>
        </DialogHeader>

        {wallets.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No wallet addresses are available right now.
          </div>
        ) : (
          <>
            {/* Network selector */}
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => {
                const badge = NETWORK_BADGES[w.network] ?? { bg: "bg-muted", text: "text-foreground" };
                const active = selectedId === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                        : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wider", !active && badge.bg, !active && badge.text)}>
                      {w.network}
                    </span>
                    {w.coin}
                  </button>
                );
              })}
            </div>

            {wallet && (
              <div className="space-y-4">
                {/* QR code */}
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-white p-4 shadow-card">
                    <QRCodeSVG
                      value={wallet.address}
                      size={180}
                      level="M"
                      marginSize={0}
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <div className="text-sm font-semibold">{wallet.label ?? `${wallet.coin} on ${wallet.network}`}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {wallet.coin} · {wallet.network} network
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Address</div>
                  <div className="flex items-stretch gap-2">
                    <code className="flex-1 break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                      {wallet.address}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => copy(wallet.address)} aria-label="Copy address">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Memo if present */}
                {wallet.memo && (
                  <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="text-xs font-medium text-amber-500">Memo / Tag (REQUIRED)</div>
                    <div className="flex items-stretch gap-2">
                      <code className="flex-1 break-all rounded-md bg-amber-500/10 px-3 py-2 text-xs">{wallet.memo}</code>
                      <Button size="icon" variant="outline" onClick={() => copy(wallet.memo!, "Memo")} aria-label="Copy memo">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-amber-500/80">
                      Without this memo your deposit may be lost.
                    </p>
                  </div>
                )}

                {/* Explorer link */}
                {explorerUrl(wallet.network, wallet.address) && (
                  <a
                    href={explorerUrl(wallet.network, wallet.address)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                  >
                    View on block explorer <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {/* Warning */}
                <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">
                  ⚠️ Only send <strong className="text-foreground">{wallet.coin}</strong> on the <strong className="text-foreground">{wallet.network}</strong> network.
                  Other coins or networks may be permanently lost.
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
