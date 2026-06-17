# Handoff

> **Read this first, every session.** It is the single source of near-term truth.
> Keep it short. Update it at the END of every session. For deep history, see `history.md`.

---

## Project in one line
NutriCostOptimizer — a web (and future mobile) app that builds the **cheapest daily meal plan** meeting a user's macro targets, using a client-side LP solver.

## Vision (north star)
- Web **and** native mobile apps from a shared core.
- **Live grocery-store pricing** via major-grocer APIs → location-aware "best cost per dollar per macro" insights.
- Until then: **optimize and harden current capabilities.**

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

## To-do (next session)
- [ ] **User action:** create Railway account, connect repo, enable PR environments. (I can't log into the host; configs are ready.)
- [ ] Generate proper PNG icon set (192/512 + maskable) — currently a single SVG brand mark placeholder.
- [ ] Wire an absolute backend URL for Capacitor builds so `/api` features work in the native app.
- [ ] Begin "optimize current capabilities" pass (perf, edge cases, UX polish) — prioritize with user.
- [ ] Apply `design.md` + `UI-UX.md` as the styling baseline; reconcile current generic Tailwind look against the brand system.
- [ ] (Future) consider code-splitting — main JS chunk is ~650 kB (jsPDF/html2canvas heavy).

## Decisions log (recent)
- 2026-06-17: Mobile = **Capacitor** (reuse React/Vite, one codebase) over React Native/Expo. PWA added alongside.
- 2026-06-17: Web host = **Railway** (single Docker container, Git-push + PR previews, no cold starts). Render/Fly noted as alternatives; Fly is the geo-ready future option.
- 2026-06-17: Future DB for live-pricing/geo → Postgres+PostGIS (Supabase available); SQLite stays for now.
- 2026-06-17: Established four steering docs (`handoff`, `history`, `design`, `UI-UX`).

## Session-end checklist (do before ending)
1. Update **Current state**, **Open issues**, and **To-do** above.
2. Move anything no longer near-term into `history.md`.
3. Keep this file lean — it exists to minimize start-of-session token cost.
