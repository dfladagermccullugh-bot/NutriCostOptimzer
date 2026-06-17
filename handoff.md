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
- Clean tree on branch `claude/relaxed-rubin-t92k4w` → PR **#1** (do not open new PRs; push to update). Railway deploy is **live** (user set it up).
- **v3.0 three-panel model is LIVE:** Snapshot / Tune / Benchmark over one basket + cost toggle; session persistence. Build green; **25 frontend + 17 backend tests passing.**
- Frontend: React 19 + TS + Vite + Tailwind 4, client-side `javascript-lp-solver`, Recharts, jsPDF export.
- Backend: FastAPI + SQLite, 200 USDA foods seeded, optional USDA API + AI-parse fallbacks (SSRF-guarded).
- No accounts; preferences + working basket in localStorage. Deploy via `docker compose up` (port 8080).
- **Infra:** Capacitor (web→iOS/Android, one codebase) + PWA. Railway host (single Docker container, Git-push + PR previews).

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
| `design.md` | Brand + visual aesthetic ⚠️ **PLACEHOLDER — user will provide their own next session (supersedes this)** | Any UI/brand work |
| `UI-UX.md` | UX laws & interaction ⚠️ **PLACEHOLDER — user will provide their own next session (supersedes this)** | Any UX/flow work |
| `PRD.md` | Full product requirements (**v3.0** — see §1A authoritative) | Feature/scope decisions |

---

## v3.0 build: CORE COMPLETE (steps 1–6)
Snapshot / Tune / Benchmark panels all live over one basket, with the cost toggle, session
persistence, trustworthy USDA/AI data, and the SSRF guard. Per-step detail is in git log + the
2026-06-17 `history.md` entries.

## Audit status (29 findings)
- **Closed:** C1, C2, C3, C4, H1 (resolved via the Tune/Benchmark split), H2, H3, H4, H5, M1, M2, M3, M5, L2, L5/F4 (test harness).
- **Open (lower priority):** L1 (edit food *name/nutrition* after adding — weight/price already editable), L3 (clipboard column alignment), L4 (`randomUUID` fallback for old WebViews), M4-FTS5 (defer until DB grows), M5 Web-Worker solver (defer; solver is sub-ms now), M6 (turn `/api/health` into a status indicator).

## NEXT SESSION — start here (priority order)
1. **Verify the live deploy** (carried from this session). PR #1 pushed a lot. Smoke-test the Railway URL: `/api/health` green → add a basket → Analyze → check all three panels + the cost toggle on Tune/Benchmark.
2. **Brand & UI pass — BLOCKED on user input.** The user will provide their own `design.md` and `UI-UX.md` next session; **those supersede the current placeholder files in the repo.** Once provided: reconcile the generic Tailwind UI to the brand system (tokens, tabular numerals, consistent macro colors, component polish across all three panels).
3. **Receipt photo → OCR basket entry** — the headline future input; required to be "fully functional." Populates the same basket the three panels read. Net-new feature → design the approach first.
4. Optional cleanups when convenient: L1 / L3 / L4 / M6, then code-split the ~650 kB JS bundle (jsPDF/html2canvas are the weight).

## Tests (run before every push)
- Frontend: `cd frontend && npm test` (Vitest, 25 — snapshot/food/optimizer/tune).
- Backend: `pip install -r backend/requirements-dev.txt && python3 -m pytest backend` (17 — nutrition/AI/security).

## Decisions log (recent)
- 2026-06-17: v3.0 core (3 panels + cost toggle) built & tested; audit critical/high tier closed (incl. quick cleanups H3/L2). User will supply own `design.md`/`UI-UX.md` next session (replaces placeholders).
- 2026-06-17: **Product reframe to v3.0** — basket optimizer, not meal planner. Three panels (Snapshot/Tune/Benchmark) over one engine + cost toggle. PRD §1A is authoritative. Functional audit done (29 findings).
- 2026-06-17: Mobile = **Capacitor** (reuse React/Vite, one codebase) over React Native/Expo. PWA added alongside.
- 2026-06-17: Web host = **Railway** (single Docker container, Git-push + PR previews, no cold starts). Render/Fly noted as alternatives; Fly is the geo-ready future option.
- 2026-06-17: Future DB for live-pricing/geo → Postgres+PostGIS (Supabase available); SQLite stays for now.
- 2026-06-17: Established four steering docs (`handoff`, `history`, `design`, `UI-UX`).

## Session-end checklist (do before ending)
1. Update **Current state**, **Open issues**, and **To-do** above.
2. Move anything no longer near-term into `history.md`.
3. Keep this file lean — it exists to minimize start-of-session token cost.
