# ARCHITECTURE

## Folder Structure

```
.
├─ src/
│  ├─ router.tsx                  # createRouter, default error component
│  ├─ routeTree.gen.ts            # AUTO-GENERATED — do not edit
│  ├─ styles.css                  # Tailwind v4 entry + design tokens
│  ├─ routes/
│  │  ├─ __root.tsx               # Root layout, head meta, AuthProvider, Toaster
│  │  ├─ index.tsx                # Marketing landing
│  │  ├─ auth.tsx                 # Sign in / sign up
│  │  ├─ studio.tsx               # Video upload + queue
│  │  ├─ queue.tsx                # Job tracker (realtime)
│  │  ├─ library.tsx              # Output gallery
│  │  ├─ presets.tsx              # Style preset CRUD
│  │  ├─ loras.tsx                # LoRA list + image-gen dialog
│  │  ├─ train.tsx                # LoRA training submission
│  │  ├─ vibe.tsx                 # Vibe Matcher (reference → preset)
│  │  ├─ assets.tsx               # Reference asset uploads
│  │  ├─ settings.tsx             # Profile + billing
│  │  ├─ pricing.tsx              # Plan grid + Paystack checkout
│  │  ├─ about.tsx, contact.tsx   # Static marketing
│  │  └─ api/public/
│  │     ├─ paystack/webhook.ts            # Paystack signed webhook
│  │     └─ hooks/
│  │        ├─ replicate-training.ts       # LoRA training completion webhook
│  │        └─ process-queue.ts            # pg_cron-driven job worker
│  ├─ components/
│  │  ├─ AppShell.tsx             # Sidebar + mobile drawer chrome
│  │  ├─ RequireAuth.tsx          # Auth gate; wraps in AppShell
│  │  ├─ UpgradeBanner.tsx        # Quota warning banner
│  │  └─ ui/                      # shadcn/ui (~50 primitives)
│  ├─ hooks/
│  │  └─ use-mobile.tsx
│  ├─ lib/
│  │  ├─ auth.tsx                 # AuthProvider + useAuth (Supabase session)
│  │  ├─ use-plan.ts              # Plan / subscription / usage hook
│  │  ├─ billing.functions.ts     # createServerFn: createCheckout, verifyCheckout, cancelSubscription
│  │  └─ utils.ts                 # cn() helper
│  └─ integrations/supabase/
│     ├─ client.ts                # Browser Supabase client (auto-generated)
│     ├─ client.server.ts         # Service-role Supabase client (auto-generated)
│     ├─ types.ts                 # DB types (auto-generated)
│     └─ auth-middleware.ts       # requireSupabaseAuth server middleware
├─ supabase/
│  ├─ config.toml                 # project_id (do not edit project-level)
│  ├─ migrations/                 # SQL migrations (read-only here)
│  └─ functions/                  # Deno edge functions
│     ├─ train-lora/
│     ├─ process-video/
│     ├─ sync-lora-status/
│     ├─ generate-image/
│     └─ vibe-match/
├─ vite.config.ts                 # Wraps @lovable.dev/vite-tanstack-config
├─ wrangler.jsonc                 # Cloudflare Worker config (nodejs_compat)
├─ tsconfig.json
├─ components.json                # shadcn config
├─ eslint.config.js
└─ package.json
```

## Tech Stack

From `package.json`, `vite.config.ts`, `wrangler.jsonc`:

- **Framework**: TanStack Start `^1.167.14` + TanStack Router `^1.168.0` (file-based routing in `src/routes/`).
- **UI runtime**: React `^19.2.0`, React DOM `^19.2.0`.
- **Build tool**: Vite `^7.3.1`, configured via `@lovable.dev/vite-tanstack-config` `^1.4.0` (which bundles `@tanstack/router-plugin`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `@cloudflare/vite-plugin`, dedupe rules, sandbox dev server config).
- **Styling**: Tailwind CSS `^4.2.1` (Tailwind v4, configured inline in `src/styles.css` via `@theme inline`), `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Component primitives**: shadcn/ui ("new-york" style) wrapping `@radix-ui/*`. Icons via `lucide-react`. Toasts via `sonner`. Carousel via `embla-carousel-react`. Dropzone via `react-dropzone`. Calendar via `react-day-picker`. Forms via `react-hook-form` + `@hookform/resolvers` + `zod`.
- **Data**: `@supabase/supabase-js` `^2.104.0`. `@tanstack/react-query` `^5.83.0` is **installed but not actively used** — no `QueryClientProvider`, no `useQuery`/`useMutation` calls were found in `src/`.
- **Server runtime**: Cloudflare Worker (per `wrangler.jsonc`: `compatibility_date: 2025-09-24`, `compatibility_flags: ["nodejs_compat"]`, entry `@tanstack/react-start/server-entry`).
- **Edge functions runtime**: Deno (Supabase Edge Functions). Imports use `jsr:@supabase/functions-js/edge-runtime.d.ts` and `jsr:@supabase/supabase-js@2`.
- **Validation**: `zod` `^3.24.2` (used in `billing.functions.ts`).
- **Lint/format**: ESLint 9 + typescript-eslint, Prettier.

## State Management

- **Auth state**: React Context in `src/lib/auth.tsx` (`AuthProvider` / `useAuth`). Holds `session`, `user`, `loading`, `signOut`. Subscribes to `supabase.auth.onAuthStateChange` and seeds with `getSession()`.
- **Plan / usage state**: `src/lib/use-plan.ts` (custom hook, local component state). Fetches `user_subscriptions`, `usage_counters`, and the matching `subscription_plans` row on mount. Exposes `isAtLimit`, `remaining`, `reload`.
- **Per-page data**: each route uses `useState` + `useEffect` directly, calling Supabase from the browser client (`src/integrations/supabase/client.ts`). RLS policies (see `supabase-tables`) enforce per-user access.
- **Realtime**: `loras.tsx` subscribes to `postgres_changes` on `public.loras` via `supabase.channel("loras-changes")`. Other realtime channels were not observed in the scanned files.
- **Forms**: `react-hook-form` + `zod` is available; ad-hoc `useState` is used for the train and studio forms.
- **No global store** (no Redux / Zustand / Jotai). No `QueryClientProvider`, despite `@tanstack/react-query` being installed.

## API Structure

Three layers:

### 1. TanStack Start server functions (RPC from the browser)

Defined with `createServerFn` in `src/lib/billing.functions.ts` and protected by the `requireSupabaseAuth` middleware (`src/integrations/supabase/auth-middleware.ts`):

| Function | Method | Input (zod) | Purpose |
|---|---|---|---|
| `createCheckout` | POST | `{ planSlug: "pro" \| "studio", currency: "USD" \| "NGN" }` | Calls Paystack `/transaction/initialize`, returns `authorizationUrl`. |
| `verifyCheckout` | POST | `{ reference: string }` | Verifies a Paystack reference, upserts `user_subscriptions`. |
| `cancelSubscription` | POST | — | Sets `cancel_at_period_end = true`. |

`requireSupabaseAuth` runs a `.client()` step that attaches `Authorization: Bearer <access_token>` and a `.server()` step that calls `supabase.auth.getClaims(token)` to authenticate.

### 2. Public HTTP routes (`/api/public/*` — no auth gate)

File-based, in `src/routes/api/public/`:

| Path | Method | Caller | Notes |
|---|---|---|---|
| `/api/public/paystack/webhook` | POST | Paystack | HMAC-SHA512 signature verified against `PAYSTACK_SECRET_KEY` using `timingSafeEqual`. Logs to `payment_events`, updates `user_subscriptions` for charge/sub events. |
| `/api/public/hooks/replicate-training` | POST | Replicate | Re-fetches training state from Replicate before mutating the `loras` row. Validates `loraId` query param against `replicate_training_id`. |
| `/api/public/hooks/process-queue` | POST | pg_cron / external scheduler | Reaps stale `processing` jobs (>15 min) and claims up to `BATCH_SIZE = 3` `pending` jobs per tick, fires `process-video` invocations. |

### 3. Supabase Edge Functions (Deno)

Invoked from the client via `supabase.functions.invoke(...)`:

| Function | Triggered by | External calls |
|---|---|---|
| `train-lora` | Client (after upload) | Replicate `ostris/flux-dev-lora-trainer` (resolves latest version dynamically), creates a private destination model, registers the `replicate-training` webhook. |
| `process-video` | Client / process-queue worker | Replicate `gfpgan` / `codeformer` (versions hardcoded). Reads preset, signs input URL, runs face restoration. |
| `sync-lora-status` | Client (manual refresh) | Replicate trainings API. Reconciles a single `loras` row. |
| `generate-image` | Client (`/loras` dialog) | Replicate (uses trained LoRA's `replicate_version_id`). Writes to `generated-images` bucket and `generated_images` table. |
| `vibe-match` | Client (`/vibe`) | Lovable AI Gateway via `LOVABLE_API_KEY`. |

## Data Flow

### Video processing
```
User → /studio → upload to `videos-input` bucket
              → INSERT into `jobs` (status=pending)
              → invoke edge fn `process-video`
                  ├─ marks job processing
                  ├─ signs input URL
                  ├─ POSTs to Replicate (gfpgan/codeformer)
                  └─ uploads result to `videos-output`, updates job
              [parallel] /api/public/hooks/process-queue (cron)
                  ├─ reaps stale processing jobs
                  └─ claims pending jobs and invokes process-video
```

### LoRA training
```
User → /train → upload N images to `lora-training` bucket
             → INSERT into `loras` (status=pending)
             → invoke edge fn `train-lora`
                 ├─ zips images, signs URL
                 ├─ ensures destination model on Replicate
                 ├─ creates training with webhook URL
                       https://<APP_URL>/api/public/hooks/replicate-training?loraId=...
                 └─ stores replicate_training_id
Replicate → POST /api/public/hooks/replicate-training
         → re-fetches training, updates `loras` row to ready / failed
```

### Image generation
```
User → /loras dialog → invoke `generate-image` with loraId + prompt
                    → Replicate (LoRA version) → write to `generated-images` bucket
                    → INSERT into `generated_images`
```

### Billing
```
User → /pricing → server fn `createCheckout`
                → Paystack /transaction/initialize → authorization_url
                → redirect → user pays
Paystack → POST /api/public/paystack/webhook  (HMAC-verified)
        → upsert payment_events, update user_subscriptions
[parallel] /settings → server fn `verifyCheckout` for instant UI feedback
```

### Auth + RLS
- Browser uses `supabase` client with the publishable (anon) key. All app tables have RLS policies keyed on `auth.uid() = user_id`.
- Server functions and edge functions use the **service-role key** (`supabaseAdmin`) and apply their own auth checks (`requireSupabaseAuth` for server fns; `loraId` re-fetch for the Replicate webhook; HMAC for the Paystack webhook).
- A separate `user_roles` table + `has_role()` SECURITY DEFINER function exists for role checks (currently the `app_role` enum is `admin | user`).
