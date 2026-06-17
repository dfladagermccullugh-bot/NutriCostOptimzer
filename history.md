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

<!-- Template for new entries — copy above this line:

## YYYY-MM-DD — <short title>

**Summary:** <what the session set out to do and what happened>

**Changes:** <code/docs changed, with reasoning>

**Decisions:** <choices made and why>

**Problems & solutions:** <issues hit and how resolved / still open>

**Carried forward:** <what moved into handoff.md>

-->
