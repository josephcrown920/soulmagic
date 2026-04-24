# ENVIRONMENT

This file lists every environment variable / secret referenced anywhere in the codebase, with the file(s) that use it. Anything not appearing here is not used by the project.

## Variables

### Browser (Vite, build-time replacement via `import.meta.env`)

These are baked into the client bundle by Vite. They must be `VITE_*` prefixed and are **safe to ship publicly** (they are public/anon keys).

| Name | Used by | What it does |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/integrations/supabase/client.ts` | Supabase project URL the browser client connects to. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/client.ts` | Supabase anon/publishable key for browser client; RLS enforces per-user access. |
| `VITE_SUPABASE_PROJECT_ID` | `.env` (declared but no `import.meta.env.VITE_SUPABASE_PROJECT_ID` reference was found in `src/`) | Lovable Cloud / Supabase project identifier. UNKNOWN runtime use. |

Also referenced indirectly:
- `import.meta.env.DEV` (in `src/router.tsx`) — Vite-provided boolean, not a configured secret. Used to show error stack traces only in dev.

### TanStack Start server / Cloudflare Worker (`process.env`)

Read inside server functions, server routes, and the SSR runtime.

| Name | Used by | What it does |
|---|---|---|
| `SUPABASE_URL` | `src/integrations/supabase/client.server.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/routes/api/public/hooks/process-queue.ts`, `src/routes/api/public/hooks/replicate-training.ts`, fallback in `src/integrations/supabase/client.ts` | Supabase project URL for server-side clients. |
| `SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/auth-middleware.ts`, fallback in `src/integrations/supabase/client.ts` | Anon key the server middleware uses to validate user JWTs via `supabase.auth.getClaims`. |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/integrations/supabase/client.server.ts`, `src/routes/api/public/hooks/process-queue.ts`, `src/routes/api/public/hooks/replicate-training.ts` | Service-role key used by `supabaseAdmin` to bypass RLS for trusted server-side writes (webhooks, cron worker). **Never expose to the browser.** |
| `PAYSTACK_SECRET_KEY` | `src/lib/billing.functions.ts`, `src/routes/api/public/paystack/webhook.ts` | Paystack secret key. Used to call Paystack's API (`/transaction/initialize`, `/transaction/verify`) and to verify webhook HMAC-SHA512 signatures. |

### Supabase Edge Functions (Deno, `Deno.env.get`)

These run inside Supabase's hosted Deno runtime, **not** in the Worker. Each must be set as a Supabase Function Secret.

| Name | Used by | What it does |
|---|---|---|
| `SUPABASE_URL` | `train-lora`, `process-video`, `sync-lora-status`, `generate-image` | Supabase project URL inside the Deno function. |
| `SUPABASE_SERVICE_ROLE_KEY` | `train-lora`, `process-video`, `sync-lora-status`, `generate-image` | Service-role key for the admin client used inside edge functions. |
| `SUPABASE_ANON_KEY` | `generate-image` (only) | Used to build a per-request user-scoped client from the caller's `Authorization` header. |
| `REPLICATE_API_TOKEN` | `train-lora`, `process-video`, `sync-lora-status`, `generate-image`, `src/routes/api/public/hooks/replicate-training.ts` | Auth token for Replicate (training, face restoration, image generation, webhook re-fetch). |
| `LOVABLE_API_KEY` | `vibe-match` | Auth token for the Lovable AI Gateway. |
| `APP_URL` | `train-lora` (optional) | Public base URL the Replicate training webhook will call back. Falls back to `https://project--1d7ae0ee-b549-4184-908f-8a647c314c6d.lovable.app` if unset. |

### Currently-set Lovable Cloud secrets (informational, from project metadata)

These secret names are known to be configured in the project's Lovable Cloud secret store: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `REPLICATE_API_TOKEN`, `PAYSTACK_SECRET_KEY`, `LOVABLE_API_KEY`. `SUPABASE_DB_URL` is provided by the platform but is not referenced anywhere in `src/` or `supabase/functions/`.

## Environments

The codebase distinguishes environments via a few signals:

### Development
- Triggered by `bun run dev` (`vite dev`).
- The Lovable Vite config (`@lovable.dev/vite-tanstack-config`) handles dev-server port/host/strictPort detection and injects `VITE_*` env vars from `.env`.
- `import.meta.env.DEV === true` → `src/router.tsx` shows raw `error.message` in the error boundary.
- Server runs on Node.js (not the Worker), so Worker-specific runtime constraints (`nodejs_compat` flag, etc.) are **not** enforced — bugs that only surface in production builds will not appear here.

### Preview
- Build via `bun run build:dev` (`vite build --mode development`) — produces a development-mode build that can be deployed to the Lovable preview environment.
- Stable preview URL pattern: `project--<lovable-project-id>-dev.lovable.app` (per the TanStack Start guidance; the Lovable project id is `1d7ae0ee-b549-4184-908f-8a647c314c6d`, so: `https://project--1d7ae0ee-b549-4184-908f-8a647c314c6d-dev.lovable.app`).
- Same secret store as production unless explicitly separated. UNKNOWN: this codebase does not branch logic on a "preview" flag.

### Production
- Build via `bun run build` (`vite build`).
- Runs on Cloudflare Workers per `wrangler.jsonc` (`compatibility_date: 2025-09-24`, `compatibility_flags: ["nodejs_compat"]`, entry `@tanstack/react-start/server-entry`).
- Stable production URL pattern: `project--<lovable-project-id>.lovable.app` → `https://project--1d7ae0ee-b549-4184-908f-8a647c314c6d.lovable.app`. This is the value the `train-lora` edge function falls back to for `APP_URL`.
- Worker-runtime restrictions apply (no `child_process`, no `sharp`, etc.). Edge functions still run in Supabase's Deno environment regardless of where the Worker is deployed.

### `.env` file in this repo
Currently contains:
```
SUPABASE_PUBLISHABLE_KEY="<anon key>"
SUPABASE_URL="https://guivxjcnxgkhpfhsjqbl.supabase.co"
VITE_SUPABASE_PROJECT_ID="guivxjcnxgkhpfhsjqbl"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_URL="https://guivxjcnxgkhpfhsjqbl.supabase.co"
```
This file is platform-managed and should not be edited manually (the Supabase integration regenerates it). The non-`VITE_` `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` here let Node-side dev SSR pick up the same values without needing the `VITE_` prefix.
