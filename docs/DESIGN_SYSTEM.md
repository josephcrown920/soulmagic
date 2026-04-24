# DESIGN SYSTEM

All values in this document are extracted directly from `src/styles.css`, `components.json`, `tailwind.config` (none — Tailwind v4 inline theme), and the components under `src/components/`.

## UI Style

- **Aesthetic**: dark-only "creator-tool" interface. Comment in `src/styles.css` line 51: `/* Dark-only creator-tool aesthetic */`. The `.dark` class block is intentionally empty: `/* dark variant identical for now since the app is dark-only */`.
- **Component library**: shadcn/ui ("new-york" style per `components.json`) on top of Radix primitives. ~50 components present in `src/components/ui/`.
- **Icon set**: `lucide-react` (declared in `components.json` and used throughout, e.g. `AppShell.tsx`).
- **Visual motifs** (from `index.tsx` / `AppShell.tsx`):
  - Gradient brand mark: 8×8 rounded-lg square filled with `bg-gradient-primary` and `shadow-elegant`.
  - Gradient text on hero (`bg-gradient-primary bg-clip-text text-transparent`).
  - Soft radial glow on body background (`--gradient-glow`, applied in `@layer base body`).
  - Cards on `bg-card/40`–`bg-card/60` with `border-border` and `shadow-card`.
  - Rounded-2xl for cards/panels, rounded-3xl for hero CTA blocks, rounded-lg for buttons/inputs.

## Colors

All colors are defined as CSS custom properties in **OKLCH** in `src/styles.css` (`:root`). Tailwind v4 maps them to utilities via the `@theme inline` block.

### Semantic tokens

| Token | Value (oklch) | Notes |
|-------|---------------|-------|
| `--background` | `0.16 0.012 270` | Near-black with slight blue-violet tint |
| `--foreground` | `0.98 0.005 270` | Near-white |
| `--card` | `0.20 0.014 270` | |
| `--card-foreground` | `0.98 0.005 270` | |
| `--popover` | `0.20 0.014 270` | |
| `--popover-foreground` | `0.98 0.005 270` | |
| `--primary` | `0.72 0.21 320` | Magenta / pink-violet — the brand accent |
| `--primary-foreground` | `0.15 0.01 270` | Dark text on primary |
| `--secondary` | `0.26 0.018 270` | |
| `--secondary-foreground` | `0.98 0.005 270` | |
| `--muted` | `0.24 0.014 270` | |
| `--muted-foreground` | `0.68 0.02 270` | |
| `--accent` | `0.30 0.04 320` | |
| `--accent-foreground` | `0.98 0.005 270` | |
| `--destructive` | `0.65 0.22 25` | Red-orange |
| `--destructive-foreground` | `0.98 0.005 270` | |
| `--success` | `0.72 0.18 155` | Green |
| `--success-foreground` | `0.15 0.01 270` | |
| `--warning` | `0.78 0.16 75` | Amber |
| `--warning-foreground` | `0.15 0.01 270` | |
| `--border` | `oklch(1 0 0 / 8%)` | White at 8% alpha |
| `--input` | `oklch(1 0 0 / 12%)` | |
| `--ring` | `0.72 0.21 320` | Same as primary |

### Sidebar tokens (separate from main surfaces)

`--sidebar` `0.13 0.012 270` (darker than background), `--sidebar-foreground` `0.92 0.01 270`, `--sidebar-primary` = primary, `--sidebar-accent` `0.22 0.014 270`, `--sidebar-border` `oklch(1 0 0 / 6%)`.

### Chart palette

`--chart-1` magenta (= primary), `--chart-2` cyan `0.7 0.18 200`, `--chart-3` amber `0.78 0.16 75`, `--chart-4` green `0.72 0.18 155`, `--chart-5` red `0.65 0.22 25`.

### Composite tokens

- `--gradient-primary`: `linear-gradient(135deg, oklch(0.72 0.21 320), oklch(0.66 0.22 280))` — magenta → violet.
- `--gradient-glow`: `radial-gradient(circle at 30% 20%, oklch(0.72 0.21 320 / 0.18), transparent 60%)` — fixed background glow on `body`.
- `--shadow-elegant`: `0 10px 40px -10px oklch(0.72 0.21 320 / 0.35)` — colored brand drop-shadow.
- `--shadow-card`: `0 1px 0 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px -12px oklch(0 0 0 / 0.6)` — inner highlight + lifted shadow.

Exposed as utilities via `@layer utilities`: `.bg-gradient-primary`, `.shadow-elegant`, `.shadow-card`.

### Color usage rules (enforced in code)

- Components use **only semantic tokens** (`bg-card`, `text-muted-foreground`, `border-border`, `bg-gradient-primary`, etc.). No hex/rgb literals or raw `text-white`/`bg-black` were found in the route/component files inspected.

## Typography

- **Font stack** (from `src/styles.css` `html, body` rule):
  ```
  ui-sans-serif, system-ui, -apple-system, "Inter", "Segoe UI", Roboto, sans-serif
  ```
  No custom web fonts are loaded.
- **Type scale** (Tailwind defaults; observed usage in routes):
  - Hero H1: `text-4xl` mobile, `md:text-7xl` desktop, `font-bold tracking-tight`.
  - Section H2: `text-3xl md:text-4xl font-bold tracking-tight`.
  - Page H1 (in-app): `text-2xl font-bold tracking-tight`.
  - Card title: `text-sm font-semibold`.
  - Eyebrow / label: `text-xs uppercase tracking-widest text-primary` or `text-muted-foreground`.
  - Body: default size, `text-muted-foreground` for secondary.
  - Micro: `text-[10px] uppercase tracking-widest` (e.g. sidebar subtitle).

## Spacing & Layout

- **Container max-widths**: `max-w-6xl` for marketing/landing/studio, `max-w-4xl` for CTA + testimonial blocks, `max-w-3xl` for the train form.
- **Section padding**: marketing uses `px-6` with vertical `pt-16 pb-24` / `py-20`. App pages use `p-4 md:p-8` on the main content (set in `AppShell.tsx`).
- **Sidebar**: fixed `w-64`, `h-full`, `border-r border-sidebar-border`, hidden on `<md`, replaced by an overlay drawer on mobile (also in `AppShell.tsx`).
- **Mobile header**: `h-14`, sticky, blurred (`bg-background/80 backdrop-blur`), only visible on `<md`.
- **Radius scale** (`@theme inline` in `styles.css`):
  - Base `--radius: 0.75rem`
  - `radius-sm` = `calc(--radius - 4px)`, `radius-md` = `-2px`, `radius-lg` = `--radius`, `radius-xl` = `+4px`, `radius-2xl` = `+8px`.
  - Common usage: `rounded-md` for buttons/inputs, `rounded-lg` for nav items / brand mark, `rounded-xl`–`rounded-2xl` for cards/panels, `rounded-3xl` for big CTA hero card.
- **Grid patterns**: features grid `grid gap-4 md:grid-cols-3`; thumbnails grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-4`; photo upload grid `grid-cols-3 sm:grid-cols-5`.

## Component Patterns

- **Button** (`src/components/ui/button.tsx`): standard shadcn variants. Brand "primary" CTA always written as:
  ```tsx
  <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
  ```
  i.e. composed with utilities, not a custom CVA variant.
- **Cards / panels**: `rounded-2xl border border-border bg-card/40` (loose) or `bg-card shadow-card` (lifted).
- **Drag-and-drop zones** (`studio.tsx`, `train.tsx`): `border-2 border-dashed`, becomes `border-primary bg-primary/5` on `isDragActive`.
- **Status pills** (e.g. plan badge in sidebar): `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`. Free plan → `bg-muted text-muted-foreground`; paid → `bg-gradient-primary text-primary-foreground shadow-elegant`.
- **Upgrade banner** (`UpgradeBanner.tsx`): `rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent`, icon in `bg-primary/20` chip, CTA → `/pricing`.
- **Forms**: shadcn `Input`, `Label`, `Select`, `Slider`, `Textarea`. Two-column form layouts use `grid gap-4 sm:grid-cols-2`.
- **Toaster**: `sonner`, mounted in `__root.tsx` as `<Toaster theme="dark" position="top-right" richColors />`.
- **Error & 404 boundaries**: centered card with destructive icon (router default error in `router.tsx`) and a `404 / Page not found` page in `__root.tsx`.
- **Auth gating**: `RequireAuth.tsx` wraps every authed route, redirects to `/auth` if no session, and renders inside `<AppShell>` so all authed pages share the same chrome.

UNKNOWN: there is no centralized motion / animation library in use beyond `tw-animate-css` (imported in `styles.css`); per-page Framer Motion is not present.
