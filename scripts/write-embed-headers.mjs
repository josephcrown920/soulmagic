import { mkdir, writeFile } from "node:fs/promises";

function allowedOrigins() {
  return [...new Set(
    (process.env.AURORA_EMBED_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .flatMap((value) => {
        try {
          const origin = new URL(value).origin;
          return origin === "null" ? [] : [origin];
        } catch {
          return [];
        }
      }),
  )];
}

const ancestors = ["'self'", ...allowedOrigins()].join(" ");
const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: frame-ancestors 'self'

/embed
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: frame-ancestors ${ancestors}
`;

await mkdir("dist", { recursive: true });
await writeFile("dist/_headers", headers, "utf8");