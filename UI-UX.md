# UI/UX — Laws & Interaction Guidelines

> The behavioral source of truth for NutriCostOptimizer (web + mobile). `design.md` governs how
> it *looks*; this governs how it *works and feels*. When in doubt, optimize for a user who is
> tired after the gym, on their phone, and just wants the cheapest plan that hits their numbers.

---

## 0. The prime directive
**Respect the user's time and intelligence.** They already weigh food and track macros — give
them speed, precision, and control. Every screen answers: *what do I do, what did it cost, what now?*

---

## 1. Foundational laws (apply these by name)

- **Fitts's Law** — Primary actions (Optimize, Add) are large and thumb-reachable. On mobile the
  Optimize button is pinned to the bottom (current pattern — keep). Don't put key actions in corners.
- **Hick's Law** — Minimize choices per step. Default everything sensible (macros prefilled from
  prefs); reveal advanced options (AI config, tolerance) progressively, not all at once.
- **Jakob's Law** — Match conventions users know from other apps. Standard inputs, standard
  swipe-to-delete, standard settings gear. Don't reinvent familiar controls.
- **Miller's Law** — Chunk information. Group food entry, goals, and results into 3 clear zones.
  Never show an undifferentiated wall of numbers.
- **Doherty Threshold** — Keep system response < 400ms perceived. The LP solve is client-side;
  show the in-place spinner immediately (current `setTimeout` UI-yield pattern) so it never feels frozen.
- **Tesler's Law** — Complexity is conserved; absorb it for the user. The solver hides LP math.
  We do the hard part (cost optimization); the user just sees grams and dollars.
- **Postel's Law** — Be liberal in input (NL parsing, lbs/oz/kg/g, sloppy text), strict and
  consistent in output (grams + USD, rounded sensibly).
- **Peak-End Rule** — The "end" is the results dashboard and export. Make that moment feel like a
  win: clear cost, clean breakdown, frictionless PDF/clipboard.
- **Aesthetic-Usability Effect** — A clean, precise look (per `design.md`) makes the tool feel
  more trustworthy with numbers. Polish is not optional in a numbers app.

---

## 2. Core flow contract (don't break this spine)

1. **Add foods** → manual or natural-language; instant, forgiving, units flexible.
2. **Set goals** → calories/protein/carbs/fat + weekly budget + tolerance; sensible defaults preloaded.
3. **Optimize** → one obvious primary action; gated until ≥ `MIN_FOODS_TO_OPTIMIZE` with a clear hint.
4. **Review** → results dashboard: cost, per-food grams, totals vs. target, macro charts.
5. **Recover (if infeasible)** → actionable diagnostics with concrete, one-tap-able suggestions.
6. **Export** → PDF / clipboard. Leave on a high note.

**Rule:** never add a step that doesn't serve this spine. New features extend zones, not the path.

---

## 3. Feedback & system status (visibility)

- **Always show state:** idle → solving (spinner in place) → result | infeasible. No dead clicks.
- **Disabled with reason:** when Optimize is gated, say *why* ("Add at least 2 foods") — current behavior, keep it.
- **Optimistic & immediate:** food adds appear instantly; never block typing on network.
- **Confirm destructive intent, not routine action:** swipe-to-delete needs a deliberate gesture;
  consider undo over modal confirm. Never lose user data silently.

---

## 4. Errors & empty states

- **Errors are next-steps, not dead-ends.** The infeasibility panel is the model: name the
  constraint, give a concrete fix ("increase budget by ~$8", "reduce protein by ~30g"), ideally tappable.
- **Empty states teach.** The results placeholder tells users exactly what to do ("Add foods, set
  targets, hit Optimize"). Every empty zone should orient, not just sit blank.
- **Network/AI/USDA failures degrade gracefully.** Core optimization is offline-capable; optional
  services failing must never block the core flow — fall back to manual entry quietly.
- **No blame.** Never imply the user did something wrong; the system adapts to them.

---

## 5. Forms & input (where users live)

- **Right defaults beat empty fields** — prefill from saved preferences.
- **Forgiving parsing** — accept "chicken breast 3lbs 15 dollars"; show what was parsed so users can correct.
- **Units explicit & consistent** — input flexible; display normalized (grams, USD).
- **Numeric ergonomics** — number keypad on mobile, right-aligned values, units adjacent, tabular figures.
- **Inline validation** — validate on blur/submit with helpful messages, not aggressive keystroke nagging.
- **Preserve work** — never wipe entered foods/goals on a failed optimize; let them tweak and retry.

---

## 6. Mobile-first & cross-platform

- **Design for the smallest screen first**, scale up to the `lg` sidebar layout (current approach).
- **Touch targets ≥ 44×44px.** Primary actions thumb-zone reachable.
- **Gestures augment, never replace** — swipe-to-delete also has an explicit control; no gesture is the *only* path.
- **Web ↔ native parity** — same flow, same vocabulary, same brand tokens. A user moving between
  web and the future mobile app should feel zero relearning.
- **Performance is UX** — system fonts, client-side solve, minimal payload. Speed is a feature.

---

## 7. Accessibility (non-negotiable baseline)

- **Contrast:** meet WCAG AA (4.5:1 text). Don't rely on color alone — pair macro colors with labels.
- **Keyboard:** full operability, visible focus rings (brand color), logical tab order.
- **Semantics:** real buttons/labels/landmarks; `aria-live` for solve results and errors.
- **Motion:** respect `prefers-reduced-motion`; animation clarifies, never decorates.
- **Targets & text:** scalable text, generous hit areas.

---

## 8. Privacy & trust as UX

- **No accounts, no login** — instant access is a core feature; don't gate the tool.
- **Local-first** — preferences in localStorage; be explicit that data stays on-device.
- **API keys are the user's** — AI/USDA keys stored locally, never phoned home; say so in settings.
- **Future live-pricing/location** — when location enters, ask explicitly, explain the value
  ("find the cheapest store near you"), and make it optional. Earn the permission.

---

## 9. Decision test (use before shipping any UI change)
1. Does it serve the core flow (§2) or distract from it?
2. Could a tired user on a phone do it one-handed in under 3 taps?
3. Does it fail gracefully and tell the user what to do next?
4. Is it consistent with `design.md` tokens and prior patterns?
5. Does it keep cost & macros honest, explicit, and unshamed?

If any answer is "no," redesign before building.
