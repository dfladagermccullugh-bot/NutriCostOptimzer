# Handoff

> **Read this first, every session.** It is the single source of near-term truth.
> Keep it short. Update it at the END of every session. For deep history, see `history.md`.

---

## Project in one line
NutriCostOptimizer — a web (and future mobile) app that **optimizes the diet a user already has**: they input the basket they already buy (foods + amounts + prices) + their daily macros, and get the cost↔macro interaction made legible and optimized.

## Product model (v3.0 reframe — see PRD §1A) — AUTHORITATIVE
- **NOT** a meal planner / shopping-list generator. It optimizes an *existing* basket.
- Input: user's actual basket (weekly foods/amounts/prices; ÷7 = daily) + daily macros. Receipt-photo/OCR is a future input mechanism.
- **One analysis, three selectable panels** (increasing aggressiveness):
  1. **Snapshot** — insight only, changes nothing: cost/100g per macro, $ per gram protein/carb/fat, spend share, macro-per-dollar leaderboard, gap to targets. *(Arithmetic; foundational MVP.)*
  2. **Tune** — re-allocate keeping every food (min-serving so nothing zeroes): hit macros for least cost. "Same groceries, eat this much → save $X."
  3. **Benchmark** — full LP (may drop foods), framed as the theoretical cost floor.
- **Cost toggle** on Tune & Benchmark: minimize spend (default) vs respect a target budget. Snapshot = report only.
- One engine produces a rich result object; all panels read from it.

## Vision (north star)
- Web **and** native mobile apps from a shared core.
- **Live grocery-store pricing** via major-grocer APIs → location-aware "best cost per dollar per macro" insights.
- Near-term: build out the three-panel basket-optimizer model above.

## Current state (as of 2026-06-17)
- Working MVP, clean tree on branch `claude/relaxed-rubin-t92k4w` → PR **#1** (do not open new PRs; push to update).
- Frontend: React 19 + TS + Vite + Tailwind 4, client-side `javascript-lp-solver`, Recharts, jsPDF export.
- Backend: FastAPI + SQLite, 200 USDA foods seeded, optional USDA API + AI-parse fallbacks.
- No accounts; preferences in localStorage. Deploy via `docker compose up` (port 8080).
- **Infra scaffolded:** Capacitor (web→iOS/Android, one codebase) + PWA (vite-plugin-pwa). Railway as host (single Docker container, Git-push deploy + PR previews). Web build verified green.

## Infra: dev & deploy quick reference
- **Web dev:** `cd frontend && npm install && npm run dev` (proxies `/api` → :8080 backend).
- **Full stack local:** `docker compose up` → http://localhost:8080.
- **Mobile (Capacitor) live reload:** `npm run dev:host`, then `export CAP_SERVER_URL=<LAN url>`, then `npm run cap:ios` / `cap:android`. Native projects are generated locally (`npx cap add ios|android`) — they are gitignored (need Xcode/Android Studio).
- **Deploy (Railway):** connect the repo in Railway dashboard → it reads `Dockerfile` + `railway.json` (healthcheck `/api/health`, honors `$PORT`). Push = redeploy + PR preview URL.
- **Mobile→backend caveat:** native shells load assets locally, so `/api` calls (AI parse, USDA search) need an **absolute backend URL** before those optional features work in-app. Core optimizer is client-side and works offline. Not yet wired.

## Steering documents (sources of truth)
| File | Purpose | When to read |
|------|---------|--------------|
| `handoff.md` | Near-term state + next-session to-dos | **Start of every session** |
| `history.md` | Long-term session log / archive | Only when referencing the past |
| `design.md` | Brand + visual aesthetic source of truth | Any UI/brand work |
| `UI-UX.md` | UX laws & interaction guidelines | Any UX/flow work |
| `PRD.md` | Full product requirements (v2.0) | Feature/scope decisions |

---

## Open issues / known gaps
- _None tracked yet — populate as they arise._

## v3.0 build sequence (the plan — work top-down)
- [x] **1. Snapshot panel (MVP of the reframe)** + basket/goals persistence (H4) + guards: reject price≤0/weight≤0 (C1 via `isUsableFood`), totals summed from rounded rows (H5). Three-panel shell live (Snapshot / Tune-stub / Benchmark=existing LP, reframed as "theoretical floor"). Analyze flow replaces Optimize.
- [x] **2. Optimizer test harness** (L5/F4) — Vitest added; 15 tests across `snapshot`/`food`/`optimizer` (`npm test`). Extend as Tune/Benchmark land.
- [x] **3. Tune panel** — keep-every-food re-allocation via a plain-language **variance slider** ("allow variance up to X%" → each food bounded to (100±X)% of current daily amount, so nothing drops to zero). Calories NOT hard-constrained (H2 fix) — reported as a derived gap. Shows current→tuned amounts, weekly savings, macros after tuning. `services/tune.ts` + 6 tests.
- [x] **4. Benchmark panel + cost toggle** — `BenchmarkPanel` self-computes (live cost toggle), reframed as theoretical floor. **Cost-objective toggle** (`CostModeToggle`) on Tune & Benchmark: "minimize spend" vs "target budget" (budget mode = cap cost at budget, minimize normalized P/C/F deviation, cost as tiebreaker). **H2 applied everywhere**: calories no longer a hard constraint (derived/reported) in optimizer + tune; diagnose no longer relaxes calories. 4 new tests (25 total). App refactored: Tune/Benchmark compute reactively from foods/goals (controls update live without re-analyzing).
- [ ] **5. Input hardening** — C2 USDA data integrity (kcal not kJ; restrict dataType), C3/C4 AI match disambiguation + fallback, M1 JSON robustness. ← **next**
- [ ] **6. M-tier hardening** — SSRF/key handling now public (M2), unit-conversion single source (M3), FTS/caching (M4), Web Worker solver (M5).
- [ ] Brand & UI implementation (`design.md` + `UI-UX.md`) — deferred until functional model lands.

### Done
- [x] Railway deploy + public URL (user). Capacitor + PWA scaffolded. PNG icon set. `VITE_API_BASE_URL` for native.
- [x] Functional audit complete (see history 2026-06-17) and product reframed to v3.0 three-panel model.
- [ ] Apply `design.md` + `UI-UX.md` as the styling baseline; reconcile current generic Tailwind look against the brand system.
- [ ] (Future) consider code-splitting — main JS chunk is ~650 kB (jsPDF/html2canvas heavy).

## Decisions log (recent)
- 2026-06-17: **Product reframe to v3.0** — basket optimizer, not meal planner. Three panels (Snapshot/Tune/Benchmark) over one engine + cost toggle. PRD §1A is authoritative. Functional audit done (29 findings).
- 2026-06-17: Mobile = **Capacitor** (reuse React/Vite, one codebase) over React Native/Expo. PWA added alongside.
- 2026-06-17: Web host = **Railway** (single Docker container, Git-push + PR previews, no cold starts). Render/Fly noted as alternatives; Fly is the geo-ready future option.
- 2026-06-17: Future DB for live-pricing/geo → Postgres+PostGIS (Supabase available); SQLite stays for now.
- 2026-06-17: Established four steering docs (`handoff`, `history`, `design`, `UI-UX`).

## Session-end checklist (do before ending)
1. Update **Current state**, **Open issues**, and **To-do** above.
2. Move anything no longer near-term into `history.md`.
3. Keep this file lean — it exists to minimize start-of-session token cost.
