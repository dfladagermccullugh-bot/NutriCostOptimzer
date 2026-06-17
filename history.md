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
