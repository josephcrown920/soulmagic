## Add a Stronger Model Tier (Pro Training)

Today every training uses the same trainer settings (rank 16, ~1000 steps). I'll add a quality preset on the Train page so users can pick a **Standard** or **Pro (stronger)** model — Pro produces noticeably sharper likeness and better prompt adherence at the cost of more training time.

### What the user sees (Train page)

A new "Model strength" selector above the steps slider with two options:

- **Standard** — ~20 min, balanced quality (current behavior)
- **Pro — stronger** — ~35 min, higher likeness + sharper detail. Marked with a "Best quality" badge.

When Pro is selected:
- The steps slider auto-bumps to 1800 (still adjustable 1500–2500)
- Helper text explains: "Higher LoRA rank, more steps, and refined learning rate. Recommended for faces you'll use a lot."
- The submit button shows "Start Pro training (~35 min)"

### Backend changes

1. **DB migration** — add a `quality` column to `loras` (`text`, default `'standard'`, check `in ('standard','pro')`).
2. **`train-lora` edge function** — read `lora.quality` and switch trainer params:
   - Standard (unchanged): `lora_rank: 16`, `learning_rate: 0.0004`, `optimizer: adamw8bit`
   - Pro: `lora_rank: 32`, `learning_rate: 0.0003`, `optimizer: adamw8bit`, default `steps: 1800` if not provided, `resolution: "768,1024"` (drops 512 — better detail, slightly slower)
3. **`train.tsx`** — send `quality` when inserting the new LoRA row.

### LoRA card (small polish)

On `/loras`, show a subtle "PRO" badge next to the LoRA name when `quality === 'pro'` so users can tell their stronger models apart.

### Out of scope

- No pricing/plan gating in this pass — Pro is available to anyone who can train. We can gate it to paid plans later by checking `plan.slug` before insert.
- No changes to generation; the stronger LoRA is automatically used at inference because we already load the trained version.

### Files touched

- `supabase/migrations/<new>_lora_quality.sql` (new)
- `supabase/functions/train-lora/index.ts`
- `src/routes/train.tsx`
- `src/routes/loras.tsx` (badge only)
