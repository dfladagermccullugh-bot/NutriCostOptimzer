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
- Working MVP, clean tree on branch `claude/relaxed-rubin-t92k4w`.
- Frontend: React 19 + TS + Vite + Tailwind 4, client-side `javascript-lp-solver`, Recharts, jsPDF export.
- Backend: FastAPI + SQLite, 200 USDA foods seeded, optional USDA API + AI-parse fallbacks.
- No accounts; preferences in localStorage. Deploy via `docker compose up` (port 8080).

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
- [ ] Confirm app builds & runs end-to-end (`docker compose up`) in current environment.
- [ ] Begin "optimize current capabilities" pass (perf, edge cases, UX polish) — prioritize with user.
- [ ] Apply `design.md` + `UI-UX.md` as the styling baseline; reconcile current generic Tailwind look against the brand system.

## Decisions log (recent)
- 2026-06-17: Established four steering docs (`handoff`, `history`, `design`, `UI-UX`).

## Session-end checklist (do before ending)
1. Update **Current state**, **Open issues**, and **To-do** above.
2. Move anything no longer near-term into `history.md`.
3. Keep this file lean — it exists to minimize start-of-session token cost.
