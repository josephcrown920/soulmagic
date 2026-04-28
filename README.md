# Soul Studio

A TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 application with a Supabase backend (database, auth, storage, edge functions).

Originally built on Lovable Cloud. This export contains everything needed to run the project in another environment (Replit, local, Vercel, Netlify, Cloudflare, etc.).

---

## 1. Prerequisites

- **Node.js 20+** (or Bun 1.1+ — recommended; the project uses `bunfig.toml`)
- A **Supabase project** (free tier is fine) — https://supabase.com
- Optional: Cloudflare account if deploying via Wrangler (`wrangler.jsonc` is included)

---

## 2. Install dependencies

```bash
bun install
# or
npm install
```

---

## 3. Environment variables

Copy `.env.example` to `.env` and fill in the values from your Supabase project (Project Settings → API).

```bash
cp .env.example .env
```

### Frontend (Vite — must be prefixed `VITE_`)

| Variable | Where to find it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → `anon` / `public` key | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | The subdomain part of your Supabase URL (e.g. `abcd1234` from `abcd1234.supabase.co`) | ✅ |

### Edge functions (set in Supabase, not in `.env`)

These are configured under **Supabase Dashboard → Edge Functions → Manage Secrets**:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |
| `LOVABLE_API_KEY` | Only if you keep using the Lovable AI gateway. Otherwise replace calls in `supabase/functions/*` with your own provider (OpenAI, Anthropic, etc.) and add that key here. |
| `REPLICATE_API_TOKEN` | Only if you use `train-lora` / `sync-lora-status` (Replicate) |
| `PAYSTACK_SECRET_KEY` | Only if you use Paystack billing |

**Never commit `.env` to git** — it is already in `.gitignore`.

---

## 4. Set up the database

The repo ships with all SQL migrations under `supabase/migrations/`.

```bash
# Install the Supabase CLI once
npm i -g supabase

# Link to your project (uses VITE_SUPABASE_PROJECT_ID)
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

---

## 5. Run locally

```bash
bun run dev
# → http://localhost:8080
```

---

## 6. Build & deploy

```bash
bun run build      # production build
bun run preview    # preview the build locally
```

The project targets **Cloudflare Workers** by default (see `wrangler.jsonc` and `@cloudflare/vite-plugin` in `package.json`). It also runs on Netlify (`netlify.toml` is included) and any Node host.

### Cloudflare deploy

```bash
npx wrangler deploy
```

Set the same `VITE_*` variables as Worker secrets:
```bash
npx wrangler secret put VITE_SUPABASE_URL
npx wrangler secret put VITE_SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put VITE_SUPABASE_PROJECT_ID
```

---

## 7. Common deploy failures

| Symptom | Fix |
|---|---|
| `Failed to resolve import "@/integrations/supabase/client"` | Run `bun install` — missing deps. |
| Blank page in production, works in dev | `VITE_*` env vars not set on the host. Vite inlines them at build time, so they must exist when you run `bun run build`. |
| `Invalid API key` from Supabase | You used the `service_role` key in `VITE_SUPABASE_PUBLISHABLE_KEY`. Use the `anon` key for the frontend. |
| Edge function returns 401 | Function has `verify_jwt = true` (see `supabase/config.toml`) and you're calling it without a logged-in user's JWT. |
| `child_process` / `sharp` / native module errors on Cloudflare | Cloudflare Workers don't support native Node modules. Move that logic to an edge function or external API. |
| Migration fails: `relation already exists` | Your DB is not empty. Either reset (`supabase db reset`) or apply migrations selectively. |

---

## 8. Project structure

```
src/
  routes/              # File-based TanStack Router pages
  components/          # Reusable UI (shadcn/ui based)
  integrations/supabase/   # Auto-generated Supabase client + types — DO NOT EDIT
  lib/                 # Utilities, auth, billing helpers
  hooks/               # React hooks
  styles.css           # Tailwind v4 theme
supabase/
  functions/           # Deno edge functions
  migrations/          # SQL migrations (apply in order)
  config.toml          # Function-level config (verify_jwt, etc.)
docs/                  # Architecture, design system, marketing notes
```

---

## 9. Useful scripts

```bash
bun run dev        # dev server with HMR
bun run build      # production build
bun run preview    # serve the production build
bun run lint       # eslint
bun run format     # prettier write
```

---

## License

Proprietary — all rights reserved.
