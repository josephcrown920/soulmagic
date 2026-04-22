
# Style Engine — Consistent face & vibe across every video

A web app that takes any new clip you shoot and runs it through **your** style recipe (face, color, vibe) so every output looks like it came from the same brand. Heavy ML runs on Replicate's GPUs; Lovable handles upload, queue, presets, library, and the AI vibe matcher.

## Core idea
**Your face & motion = from each new video. Your style = locked in your saved preset.** Drop a clip, pick (or auto-apply) a preset, get back an enhanced, color-graded, optionally re-scened video.

## Pages

1. **Home / Studio** — drag-and-drop multi-upload. Big "Process all" button. Default preset auto-applied so zero-click batching works. Recent jobs strip below.
2. **Queue** — live list of jobs (Pending → Uploading → Processing on GPU → Done). Per-job progress, thumbnail, status, cancel/retry. Toast + sound when finished.
3. **Library** — grid of every finished video with thumbnail, duration, preset used, date. Click → before/after player, download, re-run with different preset, delete.
4. **Presets** — your style recipes. Each preset bundles:
   - **Face enhancement**: model (GFPGAN / CodeFormer), strength slider, background upscale toggle
   - **Color / LUT**: upload `.cube` LUT, or sliders (saturation, contrast, warmth, sharpness, skin smoothing)
   - **Scene/identity layer** (optional): face-lock reference photo, outfit prompt, scene prompt, "include car/actor" reference images
   - Set as default, duplicate, delete
5. **Vibe Matcher** — upload a reference clip or image. Lovable AI analyzes it (color palette, mood, lighting, lens feel) and proposes a new preset with suggested slider values + LUT recommendation. One click to save.
6. **Assets** — your library of reference images: face references, outfit photos, car shots, scene backgrounds, additional actor/model references. Tag and reuse across presets.
7. **Settings** — Replicate API key, default preset, output format/resolution, notifications.

## Processing pipeline (per video)
1. Upload to storage → create job row
2. Server function calls Replicate with the chosen preset:
   - **Face pass**: GFPGAN or CodeFormer (face restoration + consistency)
   - **Optional identity lock**: face-swap / IP-Adapter using your reference photo so the same face reads across clips
   - **Optional scene/outfit pass**: video inpainting or img2vid model with scene/outfit/car reference assets
   - **Color pass**: apply LUT + grading params
3. Poll Replicate prediction → save final video URL → mark job done → thumbnail generated

## Auth & data
- Email + password sign-in (so jobs, presets, assets, library are yours)
- Database: profiles, presets, assets (reference images), jobs, luts
- File storage: input videos, output videos, thumbnails, LUT files, reference images
- All private per-user via row-level security

## AI features (via Lovable AI)
- **Vibe Matcher**: analyzes a reference clip's frames + color, returns a preset draft
- **Auto-name presets** based on settings ("Warm Cinematic", "TikTok Crisp", etc.)
- **Caption suggestions** for finished videos (optional bonus for posting)

## Design
Dark, creator-tool feel. Big video thumbnails, clean cards, Inter typography, accent color you can change in Settings. Mobile-friendly so you can check job status from your phone while shooting.

## What you'll need to provide
- A **Replicate API token** (free signup at replicate.com — pay-per-second of GPU, typically a few cents per short clip). I'll prompt for it after the first build.
- That's it. Lovable Cloud (auth, database, storage) and Lovable AI (vibe matcher) are auto-configured.

## Out of scope for v1 (can add later)
- Training a custom LoRA on your face (needs a dedicated training run on Replicate or RunPod — we can wire it in once the base app is solid)
- Real-time / live filter (would need WebRTC + always-on GPU)
- Direct posting to TikTok/Instagram (their APIs require business accounts and review)
