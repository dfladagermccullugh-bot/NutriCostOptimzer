# Design — Aesthetic & Brand Source of Truth

> The visual foundation for NutriCostOptimizer across **web and mobile**. Every styling
> decision should trace back to this document. When code and this file disagree, update one
> of them on purpose — never drift silently. Pairs with `UI-UX.md` (behavior) and `PRD.md` (product).

---

## 1. Brand essence

**Name:** NutriCostOptimizer · stylized **Nutri**Cost**Optimizer** (accent on "Cost").

**Promise:** *The cheapest plate that still hits your numbers.*

**Personality:** Precise, data-honest, athletic, no-nonsense. We are a **tool for people who
already weigh their food** — credible like a kitchen scale, not playful like a diet app. Think
*spreadsheet-grade trust meets gym-floor efficiency.*

**Three adjectives that govern every choice:** **Clear · Precise · Confident.**

**Anti-patterns (what we are NOT):** cutesy mascots, guilt/shaming language, neon "wellness"
gradients, dense finance-terminal clutter, decorative imagery that costs load time.

---

## 2. Color system

Current accent in code is Tailwind `blue-600`. We formalize that into an intentional palette.

### Core
| Token | Hex | Tailwind ref | Use |
|-------|-----|--------------|-----|
| `--brand` | `#2563EB` | blue-600 | Primary actions, brand mark "Cost", active states |
| `--brand-hover` | `#1D4ED8` | blue-700 | Hover/pressed on primary |
| `--brand-subtle` | `#EFF6FF` | blue-50 | Tinted backgrounds, selected rows |
| `--ink` | `#111827` | gray-900 | Primary text, headings |
| `--ink-muted` | `#6B7280` | gray-500 | Secondary text, labels |
| `--line` | `#E5E7EB` | gray-200 | Borders, dividers |
| `--surface` | `#FFFFFF` | white | Cards, panels |
| `--canvas` | `#F9FAFB` | gray-50 | App background |

### Semantic / data
| Token | Hex | Meaning |
|-------|-----|---------|
| `--success` | `#16A34A` (green-600) | On-target, feasible, savings |
| `--warning` | `#D97706` (amber-600) | Near tolerance edge, gentle nudges |
| `--danger`  | `#DC2626` (red-600) | Infeasible, over budget, destructive (swipe-delete) |

### Macro accent set (charts, badges — keep consistent everywhere)
| Macro | Color | Hex |
|-------|-------|-----|
| Protein | indigo-500 | `#6366F1` |
| Carbs | amber-500 | `#F59E0B` |
| Fat | rose-500 | `#F43F5E` |
| Calories | slate-700 | `#334155` |

**Rule:** macro colors are *semantic* — never recolor protein as anything but its token, on web or mobile.

### Dark mode (planned)
Invert via tokens, not hardcoded hex. `--canvas` → `#0B0F19`, `--surface` → `#111827`,
`--ink` → `#F9FAFB`, brand stays `#3B82F6` (blue-500) for contrast. Define when dark mode lands; do not hand-roll.

---

## 3. Typography

- **Family:** System UI stack first for speed and native feel:
  `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
  Optional brand display face later (e.g. *Inter* / *Geist*) — load only if it earns its weight.
- **Numerals:** Use **tabular / lining figures** for all weights, prices, and macro values so
  columns align (`font-variant-numeric: tabular-nums`). This is non-negotiable for a numbers app.
- **Scale (web base 16px):**
  | Role | Size / weight |
  |------|----------------|
  | Display / H1 | 1.5rem / 700 |
  | Section / H2 | 1.125rem / 600 |
  | Body | 1rem / 400 |
  | Label / meta | 0.875rem / 500 |
  | Micro / hint | 0.75rem / 500 |
- **Line length:** target 45–75 chars for prose; tabular data ignores this.

---

## 4. Layout, space & shape

- **Spacing scale:** 4px base — 4 / 8 / 12 / 16 / 24 / 32 / 48. Don't invent off-scale gaps.
- **Radii:** `xl` (12px) for cards & primary buttons (matches current `rounded-xl`),
  `lg` (8px) for inputs, `full` for pills/badges. Consistency reads as quality.
- **Elevation:** prefer **borders over shadows**; one soft shadow (`shadow-sm`) for raised cards.
  Avoid heavy/multiple shadow layers.
- **Grid:** content max-width `7xl` (1280px), 4px-aligned. Sidebar `400px` fixed on `lg+`,
  stacked single-column on mobile (current pattern — keep it).
- **Density:** comfortable, not cramped. This is a workbench, but it must breathe.

---

## 5. Components (visual contract)

- **Primary button:** `--brand` bg, white text, `rounded-xl`, full-width on mobile,
  visible disabled state (`gray-300`), spinner-in-place when working.
- **Cards/panels:** `--surface` on `--canvas`, `--line` border, `rounded-xl`, `shadow-sm`.
- **Inputs:** `--line` border, `rounded-lg`, brand focus ring. Numeric inputs right-aligned with units.
- **Badges/pills:** macro-colored, `rounded-full`, used for at-a-glance macro tags.
- **Destructive (swipe-to-delete):** `--danger` reveal; require intent, never silent data loss.
- **Charts (Recharts):** use macro accent set; minimal axes; label values directly over legends where possible.

---

## 6. Iconography & imagery

- **Icons:** single-line, 20–24px, `currentColor` (current inline-SVG approach is fine). One icon family only.
- **Emoji:** acceptable sparingly as lightweight illustration in empty states (current 🍴 placeholder) — never in core data UI.
- **Photography:** avoid. Data and clarity are the aesthetic. No stock food imagery.

---

## 7. Voice & microcopy

- Direct, quantitative, encouraging-not-preachy. *"Cheapest plan found: $6.20/day"* not *"Great job!"*.
- Never shame food choices or moralize calories. We optimize cost & macros, full stop.
- Money always explicit (`$6.20`), macros with units (`180g protein`, `2,500 kcal`).
- Errors are actionable: say what to change (mirrors the infeasibility diagnostics).

---

## 8. Cross-platform & future

- **Tokens first:** colors/space/type defined as tokens (CSS vars / Tailwind theme) so the
  **mobile app reuses the same system** — brand parity web ↔ native is a hard requirement.
- **Mobile-first** remains the default canvas; web scales up from it.
- **Live-pricing future:** reserve visual language now — a location/store affordance and a
  "best value" highlight treatment (likely `--success`) for the cost-per-macro winner.

---

## 9. Current state vs. target

The app today uses generic Tailwind defaults with a `blue-600` accent. That is the *seed*, not
the destination. Bringing the codebase up to this document (tokenized palette, tabular numerals,
macro color consistency, intentional radii/elevation) is tracked in `handoff.md` to-dos.
