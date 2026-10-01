# Lost & Found — Design Specification ("Quiet Storm")

## 1. Aesthetic Direction

**Philosophy:** A calm, confident dark tool in the spirit of Linear and Vercel, with a warm human touch. Thor appears only as subtle hints.
- The interface emphasizes clarity, density, and craftsmanship over flashiness.
- No cyan, gold, purple, crimson, or blue gradients anywhere.
- No generic AI glassmorphism blobs or colored glows on cards.
- Maximum one soft accent glow, only behind the hero lightning line and on the primary button focus ring.

---

## 2. Color System (OKLCH Tokens)

All colors are defined using OKLCH in CSS variables:

| Variable | Value | Role |
| :--- | :--- | :--- |
| `--background` | `oklch(0.145 0.006 265)` | Near-black, slightly cool canvas |
| `--surface` | `oklch(0.185 0.007 265)` | Primary container cards and toolbars |
| `--surface-raised` | `oklch(0.22 0.008 265)` | Hover states, active tabs, dialog surfaces |
| `--border` | `oklch(1 0 0 / 0.08)` | Hairline dividers and default card borders |
| `--border-strong` | `oklch(1 0 0 / 0.14)` | Hover borders and active input states |
| `--text` | `oklch(0.96 0.005 90)` | Primary text |
| `--text-muted` | `oklch(0.7 0.01 265)` | Secondary body copy and subtitles |
| `--text-faint` | `oklch(0.55 0.01 265)` | Captions, hotkey hints, and metadata |
| `--accent` | `oklch(0.85 0.17 90)` | Storm Amber: single brand accent |
| `--accent-foreground` | `oklch(0.2 0.02 90)` | Text on accent backgrounds |
| `--danger` | `oklch(0.65 0.2 25)` | Used exclusively for errors and delete actions |

### Status Badges (No Color Coding)
- **Lost:** Solid text-color chip (`bg-foreground text-background`) labeled "LOST".
- **Found:** Outlined chip (`border border-border text-foreground`) labeled "FOUND".
- **Recovered:** Accent-tinted chip (`border border-accent/30 bg-accent/10 text-accent`) with a check icon.

---

## 3. Typography & Rhythm

- **Display Headline:** Fraunces (`@fontsource/fraunces`), serif display, sentence case, left-aligned.
- **UI & Body:** Geist Sans (`@fontsource-variable/geist`), clean geometric grotesk.
- **Metadata & Counters:** Geist Mono (`@fontsource-variable/geist-mono`), tabular numerals.

### Type Scale
- `54px` (Hero Display): Fraunces, weight 400, line-height 1.08, letter-spacing -0.02em.
- `24px` (Section Title): Fraunces, weight 400, line-height 1.2.
- `16px` (Lead Copy): Geist Sans, weight 400.
- `14px` (Standard Body / Cards / Buttons): Geist Sans, weight 500 / 600.
- `13px` (Inputs & Labels): Geist Sans, weight 400 / 500.
- `12px` (Secondary Meta): Geist Sans, weight 400.
- `11px` (Mono Chips & Timestamps): Geist Mono, weight 500.

`text-wrap: balance` is applied to headings; `text-wrap: pretty` to body copy.

---

## 4. Layout, Radii & Surface Depth

- **Concentric Radii:**
  - Cards: `14px`
  - Inputs & Buttons: `10px`
  - Chips & Pills: `9999px`
- **Surface Depth:** Achieved via subtle elevation steps (`surface` -> `surface-raised`), not glows.
- **Top-Edge Highlight:** `box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.05)` on cards and panels for tactile physical depth.
- **Spacing Grid:** Strict 4px base multiplier (4, 8, 12, 16, 20, 24, 32, 48px).
- **Hit Areas:** Minimum 40px on all interactive elements.

---

## 5. Thor Hints (Subtle)

1. **Hero Lightning Line:** A thin, hand-drawn-looking 1px SVG crack in Storm Amber (60% opacity) animated with `stroke-dashoffset` (900ms, runs once on load). Faint radial glow (8% opacity) behind it.
2. **Action Flash:** On successful post or on "Mark as recovered", a single 350ms flash overlay (white-amber at 10% opacity) plus a short bolt drawn across the card.
3. **Copy:**
   - "Lost something on campus? Let's bring it home."
   - "Recently posted"
   - "Recovered"
   - "Built for the Asgard finals."

---

## 6. Motion Specifications

- **Skeleton Loading:** 350ms shimmer skeleton matching the real card structure on first load and on search/filter changes.
- **Image Blur-Up:** Neutral surface placeholder until images finish loading asynchronously.
- **Button Press:** `scale: 0.97`, duration `120ms`.
- **Card Hover:** `translateY(-2px)`, border turns to `border-strong`, image scales to `1.03`.
- **Search Highlight:** Clean accent underline on matched text tokens (not a background blob).
- **Reduced Motion:** All transitions and animations collapse to instantaneous updates under `prefers-reduced-motion: reduce`.
