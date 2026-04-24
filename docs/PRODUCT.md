# PRODUCT

## Purpose

**Style Engine** is a "consistency studio" for video and image creators. It lets a user train a personal LoRA (face or style), define reusable visual presets (LUT, color grading, face restoration), and run uploaded video clips through a GPU pipeline so every output stays on-brand.

Marketing positioning (from `src/routes/index.tsx` and `src/routes/__root.tsx`):

> "Style Engine — consistent face & vibe across every video. Drop a clip, lock in your style. GPU-powered face enhancement and color grading that keeps every video on-brand."

## Target Users

Inferred strictly from in-app copy (testimonial in `index.tsx`, plan names in `subscription_plans`, sidebar tools):

- **Independent creators** producing short-form / personal-brand video who want one consistent look across clips.
- **Studios / small teams** (the `studio` plan slug exists in `subscription_plans`) needing higher quotas and priority queue.
- Region targeting: pricing supports both **USD** and **NGN** (Paystack currencies in `billing.functions.ts` and `subscription_plans` columns `price_usd_cents` / `price_ngn_kobo`).

## Core Features

Derived from routes in `src/routes/` and edge functions in `supabase/functions/`.

| Area | Route(s) | Backend | What it does |
|------|----------|---------|--------------|
| Marketing landing | `/` (`index.tsx`) | — | Hero, features, workflow, pricing CTA. Auto-redirects signed-in users to `/studio`. |
| Auth | `/auth` (`auth.tsx`) | Supabase Auth | Sign in / sign up. |
| Studio (video processing) | `/studio` (`studio.tsx`) | `process-video` edge function, `videos-input` bucket, `jobs` table | Drag-and-drop one or more videos, pick a preset, queue jobs. |
| Queue | `/queue` (`queue.tsx`) | `jobs` table (realtime) | Track progress / status of jobs. |
| Library | `/library` (`library.tsx`) | `jobs`, `generated_images`, `videos-output` / `generated-images` buckets | View finished outputs. |
| Presets | `/presets` (`presets.tsx`) | `presets` table | Create/edit reusable style recipes (face model, face strength, LUT, color sliders, scene prompt, etc.). |
| LoRAs | `/loras` (`loras.tsx`), `/train` (`train.tsx`) | `train-lora`, `sync-lora-status`, `generate-image` edge functions, `loras` table, `lora-training` bucket | Train custom FLUX LoRAs (face/style) on Replicate (`ostris/flux-dev-lora-trainer`), generate stills from them. |
| Vibe Matcher | `/vibe` (`vibe.tsx`) | `vibe-match` edge function (uses Lovable AI Gateway) | Reference-image-driven preset suggestion. |
| Assets | `/assets` (`assets.tsx`) | `assets` table, `assets` bucket | Upload reference images (face refs, scene refs). |
| Settings & Billing | `/settings` (`settings.tsx`) | `profiles`, `user_subscriptions`; `billing.functions.ts` server fns; `paystack/webhook` | Profile, default preset, plan management. |
| Pricing | `/pricing` (`pricing.tsx`) | `subscription_plans`, `createCheckout` server fn → Paystack | Plan comparison, currency switch (USD/NGN), checkout. |
| About / Contact | `/about`, `/contact` | — | Static marketing pages. |

### Pipeline & integrations actually wired up

- **Replicate** for: LoRA training (`ostris/flux-dev-lora-trainer`), face restoration (`gfpgan`, `codeformer` versions hardcoded in `process-video/index.ts`), and image generation from trained LoRAs.
- **Lovable AI Gateway** (`LOVABLE_API_KEY`) used by the `vibe-match` edge function.
- **Paystack** for subscription checkout and webhook-driven sub state (`src/routes/api/public/paystack/webhook.ts`).
- **Cron-style queue worker** at `src/routes/api/public/hooks/process-queue.ts` — claims `pending` jobs and reaps stale `processing` jobs older than 15 min.
- **Replicate training webhook** at `src/routes/api/public/hooks/replicate-training.ts` — finalizes LoRA rows when training completes.

## User Flow

Reconstructed from the routes and `RequireAuth` gating.

1. **Land on `/`** → marketing site. If already signed in, auto-redirect to `/studio`.
2. **Sign up / sign in at `/auth`.** A row in `profiles` is auto-created (DB trigger `handle_new_user`); a `free` subscription row is auto-created (`handle_new_user_subscription`).
3. **(Optional) Upload reference assets** at `/assets` and **train a LoRA** at `/train` (10–25 photos → `lora-training` bucket → `train-lora` edge function → Replicate → webhook updates `loras.status` to `ready`).
4. **Build a preset** at `/presets` (LUT, face model + strength, color sliders, optional scene prompt / LoRA reference).
5. **Process video** at `/studio`: drag clips → upload to `videos-input` bucket → insert row in `jobs` → `process-video` edge function (or the cron worker) sends to Replicate.
6. **Track in `/queue`**, **view results in `/library`**.
7. **Generate images** from a trained LoRA via the dialog on `/loras` (writes to `generated_images` and `generated-images` bucket).
8. **Vibe Matcher** at `/vibe`: drop a reference image → AI suggests preset values.
9. **Hit a quota** → `UpgradeBanner` appears → user goes to `/pricing` → Paystack checkout → webhook + `verifyCheckout` updates `user_subscriptions`.

UNKNOWN: there is no in-app onboarding tour or first-run wizard found in the codebase.
