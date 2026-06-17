# History — Long-Term Session Archive

> Permanent, append-only record of sessions. **Not** read at session start (that's `handoff.md`).
> Reference this only when you need to recover past context, rationale, or decisions.
> Newest entries at the top.

---

## 2026-06-17 — Steering documents established

**Summary:** Reviewed the full project to understand scope, direction, and purpose.
Created the four-document steering system to act as baseline sources of truth.

**Context captured:**
- Project is a working MVP of NutriCostOptimizer (cost-minimized meal planning via client-side LP solver).
- Vision clarified by owner: ship as **web + native mobile**, and ultimately connect to
  **live grocery-store pricing APIs** for geographic "best cost per dollar per macro" insights.
  Near-term directive: **optimize existing capabilities** first.
- Stack confirmed: React 19 / TS / Vite / Tailwind 4 / Recharts / jsPDF (frontend);
  FastAPI / SQLite + 200 seeded USDA foods (backend); optional AI-parse and USDA API fallbacks.
- No accounts; localStorage-only persistence; Docker Compose deploy on port 8080.

**Artifacts created:**
- `handoff.md` — near-term state + next-session to-dos (read every session).
- `history.md` — this file.
- `design.md` — brand & visual aesthetic source of truth.
- `UI-UX.md` — UX laws & interaction guidelines.

**Decisions:**
- Steering docs live at repo root. `UI/UX.md` stored as `UI-UX.md` (a literal `/` would create a directory).

**Open threads carried into next session:** see `handoff.md` → To-do.

---

## 2026-06-17 — v3.0 core build (Snapshot / Tune / Benchmark) + audit fixes

**Summary:** Built the entire three-panel basket-optimizer model and closed the critical/high tier
of the functional audit, all test-backed. Branch `claude/relaxed-rubin-t92k4w` → PR #1.

**Engines (frontend `services/`):**
- `food.ts` `isUsableFood` — single validity gate (price>0, weight>0, has macros). Fixes C1; used by snapshot, tune, optimizer so a zero-price food can never be "free."
- `snapshot.ts` — pure arithmetic (weekly ÷7 = daily): cost/macros delivered, $/g per macro, spend share, where-your-money-goes by calorie share, gaps vs targets. Totals summed from rounded rows (H5). Exposes `macroGap`.
- `tune.ts` — LP keeping every food within ±variance% of current daily amount (lower bound>0 ⇒ nothing dropped). Two cost modes.
- `optimizer.ts` — reworked into `minimize` (cheapest to hit P/C/F within tolerance) and `budget` (cap cost, minimize normalized P/C/F deviation via L1 aux vars, cost tiebreaker) modes. **Calories no longer a hard constraint anywhere (H2)** — derived/reported; `diagnose` no longer relaxes calories. Cost summed from allocation (correct in budget mode).

**UI:** `SnapshotPanel`, `TunePanel` (plain-language variance slider), `BenchmarkPanel` (self-computing, "theoretical floor"), shared `CostModeToggle`. `App` rewritten: "Analyze Basket" + three-tab switcher; Tune/Benchmark recompute reactively (controls update live). `store/session.ts` persists basket+goals (H4).

**Backend:** `services/nutrition.py` (C2: Energy kcal-only, restrict to Foundation/SR-Legacy; M1: fenced/prose JSON extraction). `services/security.py` (M2: SSRF allowlist + private-IP block; `AI_ALLOW_ANY_ENDPOINT`/`AI_ENDPOINT_ALLOWLIST`). `food_search.py` C3 candidates path uses these; batched cache write (M4); narrowed excepts (M5). `ai_proxy.py` uses both helpers.

**Input UX:** FoodInput AI mode shows top-5 USDA matches (C3) and falls through to manual nutrition when none (C4). Decimal budgets (H3). Inline validation errors instead of silent failures on row-edit and structured-add (L2). Unit conversion unified in `constants.ts` (M3).

**Tests:** Vitest 25 (snapshot/food/optimizer/tune) + pytest 17 (nutrition/AI/security). `backend/requirements-dev.txt` added.

**Deferred (intentional):** M4 FTS5, M5 Web-Worker solver (not needed at current scale). Open low-pri: L1 (name/nutrition edit), L3, L4, M6.

**Carried to next session:** verify live deploy; user provides own design.md/UI-UX.md → brand pass; receipt OCR. See handoff.

---

## 2026-06-17 — Functional audit + product reframe to v3.0 (basket optimizer)

**Summary:** Ran an exhaustive functional audit of the whole app (every backend service/router/db
layer + every frontend component/hook/service), then the owner reframed the product. Captured the
new direction into the PRD (v3.0) and handoff.

**Functional audit (29 findings, by severity):**
- *Critical:* C1 zero/missing price → "free" food the LP abuses (no price>0 guard); C2 USDA calories
  may be kJ not kcal + branded foods break per-100g basis; C3 AI mode auto-picks wrong nutrition
  match (orders by shortest name); C4 AI mode dead-ends when no USDA match.
- *High:* H1 pure cost-min produces degenerate plans (eat 1.5kg of 3 foods); H2 calorie window
  fights macro windows → false infeasibility; H3 budget integer-only; H4 basket/goals lost on
  refresh; H5 displayed per-food macros don't sum to totals.
- *Medium:* M1 brittle AI JSON parse; M2 SSRF + user keys transit server (now public); M3 duplicate
  unit-conversion tables (frontend/backend drift); M4 LIKE '%q%' won't scale + per-food cache
  inserts; M5 broad except + main-thread solver; M6 dead/misleading health check.
- *Low:* L1 row-edit unit mismatch/silent discard; L2 silent fail on invalid; L3 clipboard column
  alignment; L4 randomUUID secure-context; L5 **no automated tests anywhere**.

**Reframe (owner directive):** Product is NOT a meal planner / shopping-list generator. It
**optimizes the diet the user already has** — they input the basket they already buy + daily
macros; the app makes the cost↔macro interaction legible and optimizable. Resolved via **one
analysis, three selectable panels**: Snapshot (insight), Tune (re-allocate keeping every food),
Benchmark (theoretical floor). Cost toggle (minimize vs target budget) on Tune & Benchmark.
This elegantly resolves H1 (keep-basket vs cheapest-subset become Tune vs Benchmark). Receipt
photo/OCR is a future input mechanism feeding the same model.

**Docs changed:** `PRD.md` → v3.0 (new §1A authoritative product model; Overview & Goals revised;
§5.3/§5.4 marked LEGACY/superseded; re-sequenced delivery). `handoff.md` → product model section +
v3.0 build sequence. Build order: Snapshot+persistence+C1/H5 → test harness → Tune+H2 → Benchmark+
cost toggle → input hardening (C2/C3/C4/M1) → M-tier.

**Carried forward:** Start build at Snapshot panel (see handoff build sequence).

---

## 2026-06-17 — Loose ends: PNG icons + Capacitor backend URL

**Summary:** User completed the Railway deploy (live public URL). Cleared the two carried-over
loose ends to unblock mobile.

**Changes:**
- **PNG icon set** generated from the brand mark (rasterized via `@resvg/resvg-js`, installed
  `--no-save` so it is not a project dependency): `icon-192.png`, `icon-512.png`,
  `icon-512-maskable.png` (full-bleed for launcher masks), `apple-touch-icon.png` (180),
  `favicon-32.png`. Manifest (`vite.config.ts`) and `index.html` now reference PNGs; the SVG
  remains as a modern favicon.
- **Configurable backend URL:** `src/services/api.ts` now prefixes all three fetches with
  `API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""`. Web/PWA = relative `/api` (same origin);
  Capacitor native builds set `VITE_API_BASE_URL` to the Railway URL. Typed in `vite-env.d.ts`;
  documented in new `frontend/.env.example`.

**Verification:** `npm run build` green; dist contains all PNGs + `manifest.webmanifest` pointing
at them; `sw.js` generated.

**Carried forward:** Brand & UI implementation (apply design.md/UI-UX.md) is the next major thread.

---

## 2026-06-17 — Web + mobile infrastructure scaffolded

**Summary:** Set the initial infrastructure direction for the long-term web+mobile vision and
scaffolded it into the repo. PR #1 is the live PR for branch `claude/relaxed-rubin-t92k4w`.

**Decisions (with rationale):**
- **Mobile = Capacitor.** The app is a React DOM + Tailwind SPA with a client-side LP solver, so
  Capacitor wraps the *exact* web build into iOS/Android with near-zero rewrite → one codebase for
  all three targets. React Native/Expo rejected for now (would require a full UI rewrite).
- **Host = Railway.** Existing `Dockerfile` already builds frontend + serves it from FastAPI as one
  unit, so a single-container host is the least-change path. Railway gives Git-push deploy + per-PR
  preview environments with no cold starts (~$5/mo). Render (free w/ cold starts) and Fly.io
  (geo-ready, CLI-first) documented as alternatives; Fly flagged as the future geo option.
- **PWA added** alongside Capacitor (installable web app, free).
- **Future DB:** when live grocery pricing + geo land, move SQLite → Postgres+PostGIS (Supabase
  integration is available in the environment). No change now.

**Changes:**
- `Dockerfile`: CMD now honors Railway's `$PORT` (`${PORT:-8080}`), defaults to 8080 locally.
- `railway.json`: Dockerfile builder, healthcheck `/api/health`, restart policy.
- `frontend/package.json`: added `@capacitor/core|cli|ios|android`, `vite-plugin-pwa`; scripts
  `dev:host`, `cap:sync`, `cap:ios`, `cap:android`.
- `frontend/capacitor.config.ts`: appId/appName/webDir=dist; live-reload via `CAP_SERVER_URL` env.
- `frontend/vite.config.ts`: `VitePWA` (autoUpdate manifest + SW; `navigateFallbackDenylist` keeps
  `/api` out of the service worker).
- `frontend/index.html`: theme-color, apple-touch/web-app meta, svg icon, viewport-fit=cover.
- `frontend/public/icon.svg`: placeholder brand mark (blue rounded square, white "N").
- `.gitignore`: ignore generated `frontend/ios/`, `frontend/android/`, `dev-dist/`.

**Verification:** `npm install` + `npm run build` pass; PWA emits `sw.js` + `manifest.webmanifest`.
Native platform folders NOT generated here (need Xcode/Android Studio) — user runs `cap add` locally.

**Carried forward (see handoff.md):** user must create/connect Railway; generate real PNG icon set;
wire absolute backend URL for Capacitor `/api`; future code-splitting of the ~650 kB main chunk.

---

<!-- Template for new entries — copy above this line:

## YYYY-MM-DD — <short title>

**Summary:** <what the session set out to do and what happened>

**Changes:** <code/docs changed, with reasoning>

**Decisions:** <choices made and why>

**Problems & solutions:** <issues hit and how resolved / still open>

**Carried forward:** <what moved into handoff.md>

-->
