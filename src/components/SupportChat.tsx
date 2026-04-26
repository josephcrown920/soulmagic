import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm **Soul Support** 👋\n\nAsk me anything about training LoRAs, generating images, video processing, billing, or your account.",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const history = [...messages.filter((m) => m !== WELCOME || messages.length > 1), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed to send" }));
        if (resp.status === 429) toast.error("Too many requests — try again in a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Top up in workspace usage.");
        else toast.error(err.error ?? "Chat failed");
        setLoading(false);
        return;
      }

      let assistant = "";
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      // Insert empty assistant message we'll keep updating
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistant += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-primary text-primary-foreground shadow-elegant transition-transform hover:scale-105",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-50 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden",
            "h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-border bg-card shadow-elegant",
          )}
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Soul Support</div>
              <div className="text-[11px] text-muted-foreground">Usually replies instantly</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
