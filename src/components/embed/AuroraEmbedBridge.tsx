import { useEffect } from "react";

const SOURCE = "aurora-soul";

function trustedHostOrigin(): string | null {
  const requested = new URLSearchParams(window.location.search).get("hostOrigin");
  if (!requested) return null;

  const allowed = (import.meta.env.VITE_AURORA_EMBED_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  try {
    const origin = new URL(requested).origin;
    return allowed.includes(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function AuroraEmbedBridge() {
  useEffect(() => {
    const hostOrigin = trustedHostOrigin();
    if (!hostOrigin || window.parent === window) return;

    const sendHeight = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      window.parent.postMessage({ source: SOURCE, type: "height", height }, hostOrigin);
    };

    window.parent.postMessage({ source: SOURCE, type: "ready" }, hostOrigin);
    sendHeight();

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return null;
}