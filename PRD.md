# NutriCostOptimizer — Product Requirements Document

**Version:** 2.0
**Date:** 2026-04-01
**Status:** Draft

---

## 1. Overview

NutriCostOptimizer is a self-hostable web application that generates cost-minimized daily meal plans satisfying user-defined macronutrient targets. It is built for bodybuilders and macro-trackers who already weigh their food in grams and retain store receipts — users who want to optimize a process they already invest significant thought into.

The application accepts food items with prices and weights (via natural language or structured input), resolves verified nutritional data from a local database backed by USDA FoodData Central, and runs a linear programming solver to produce the cheapest possible daily food allocation that hits the user's macro targets.

---

## 2. Target User

- Bodybuilders and strength athletes who track macros daily.
- Individuals who weigh food in grams and reference nutrition labels.
- Budget-conscious users who keep store receipts and want to minimize weekly food cost.
- Users comfortable self-hosting via Docker or accessing a hosted instance on any device.

**Key user behavior assumptions:**
- Users know their macro targets (calories, protein, carbs, fat).
- Users buy groceries, read labels, and know what they paid.
- Users prefer grams as the output unit for food quantities.
- Users accept common imperial and metric units for input (lbs, oz, kg, g).
- Each session is treated as fresh — users take what they need and start over.

---

## 3. Goals & Non-Goals

### Goals
- Minimize daily food cost while meeting macro targets within tolerance.
- Accept natural language input (e.g., "chicken breast 3lbs 15 dollars") parsed by any OpenAI-compatible AI API.
- Provide verified nutritional data from a local USDA-based database, falling back to the USDA FoodData Central API when a food is not found locally.
- Run on any device — fast, responsive, mobile-first.
- Self-hostable via `docker compose up`.
- No user accounts. No login. Instant access.
- Persist only user preferences (API config, default macro targets, preferred units) in browser localStorage for faster subsequent sessions.

### Non-Goals (Future Considerations)
- User accounts and authentication.
- Recipe or composite food support.
- Dietary restriction filtering (vegan, gluten-free, allergies).
- Meal-structured plans (breakfast/lunch/dinner assignment).
- Food price history or trend tracking.
- Grocery store API integrations or price scraping.

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                  Client (SPA)               │
│  React + TypeScript + Tailwind CSS          │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  Food    │ │  Goal    │ │  Results    │ │
│  │  Input   │ │  Config  │ │  Dashboard  │ │
│  └────┬─────┘ └──────────┘ └─────────────┘ │
│       │                                     │
│  ┌────┴─────────────────────────────────┐   │
│  │  LP Solver (client-side)             │   │
│  └──────────────────────────────────────┘   │
│       │                                     │
│  ┌────┴─────────────────────────────────┐   │
│  │  localStorage (preferences only)     │   │
│  └──────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │ HTTP
┌───────────────┴─────────────────────────────┐
│               Backend (API)                  │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │  /api/parse  │  │  /api/foods/search   │  │
│  │  (AI proxy)  │  │  (nutrition lookup)  │  │
│  └──────┬───────┘  └──────────┬───────────┘  │
│         │                     │              │
│  ┌──────┴───────┐  ┌─────────┴────────────┐ │
│  │  OpenAI-     │  │  Local SQLite DB     │ │
│  │  compatible  │  │  (USDA subset)       │ │
│  │  AI API      │  │         │            │ │
│  └──────────────┘  │  ┌─────┴──────────┐  │ │
│                    │  │ USDA FoodData   │  │ │
│                    │  │ Central API     │  │ │
│                    │  │ (fallback)      │  │ │
│                    │  └────────────────┘  │ │
│                    └─────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 19, TypeScript, Vite | Modern, fast builds, strong typing |
| Styling | Tailwind CSS 4 | Utility-first, responsive-first, no custom CSS overhead |
| Charts | Recharts | Lightweight React-native charting |
| LP Solver | javascript-lp-solver (client-side) | No backend round-trip for optimization |
| Backend | FastAPI (Python) | Fast async API, minimal boilerplate, excellent for proxy/search endpoints |
| Database | SQLite | Zero-config, file-based, bundles with Docker image |
| Container | Docker + Docker Compose | Single-command deployment |
| PDF Export | Client-side generation (jsPDF or equivalent) | No server-side rendering dependency |

### 4.3 Backend Responsibilities

The backend is intentionally thin. It has three jobs:

1. **AI Proxy** (`POST /api/parse`) — Forwards natural language food input to the user-configured OpenAI-compatible API endpoint. Keeps the API key server-side (configured via environment variable or passed per-request from client if user prefers browser-only key storage).
2. **Food Search** (`GET /api/foods/search?q=`) — Searches the local USDA SQLite database. If no match is found, queries the USDA FoodData Central API as fallback, caches the result into the local DB for future lookups.
3. **Static File Server** — Serves the built frontend SPA.

### 4.4 Deployment

```yaml
# docker-compose.yml structure
services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data        # SQLite DB persistence
    environment:
      - AI_API_KEY=${AI_API_KEY:-}
      - AI_API_URL=${AI_API_URL:-}
      - AI_MODEL=${AI_MODEL:-}
      - USDA_API_KEY=${USDA_API_KEY:-}
```

Single container. No external database dependencies. `docker compose up` and go.

---

## 5. Features

### 5.1 Food Input

#### 5.1.1 Natural Language Input (Default — Requires AI)

**Flow:**
1. User types free-text input into a single text field.
   - Example: `chicken breast 3lbs 15 dollars`
   - Example: `2 dozen eggs 4.99`
   - Example: `5lb bag white rice $8`
2. Client sends text to `POST /api/parse`.
3. Backend forwards to the configured AI API with a structured system prompt.
4. AI returns a parsed JSON object:
   ```json
   {
     "name": "chicken breast",
     "weight_g": 1360.78,
     "price_usd": 15.00,
     "original_input": "chicken breast 3lbs 15 dollars"
   }
   ```
5. Client sends `name` to `GET /api/foods/search?q=chicken+breast`.
6. Backend returns USDA nutritional data per 100g:
   ```json
   {
     "name": "Chicken breast, boneless, skinless, raw",
     "per_100g": {
       "calories": 120,
       "protein_g": 22.5,
       "carbs_g": 0,
       "fat_g": 2.6
     },
     "source": "local_db"
   }
   ```
7. Client displays the parsed food with price, weight, and nutrition for user confirmation.
8. User confirms or edits before adding to their food list.

**AI System Prompt Contract:**
The system prompt instructs the AI to extract `name`, `weight`, `weight_unit`, and `price` from natural language. Weight unit conversion to grams is handled server-side (not by the AI) to ensure deterministic accuracy. The AI is not asked to estimate nutrition — that comes from USDA data.

**Supported weight units for conversion:**
| Input Unit | Grams |
|-----------|-------|
| g | 1 |
| kg | 1000 |
| oz | 28.3495 |
| lb / lbs | 453.592 |

#### 5.1.2 Structured Manual Input (Fallback — No AI Required)

Available when no AI API is configured, or toggled by the user at any time.

**Flow:**
1. User is presented with explicit labeled fields:
   - **Food name** (text) — used to search USDA database
   - **Weight** (number) + **Unit** (dropdown: g, kg, oz, lb)
   - **Price** (number, USD)
2. On food name entry, app searches USDA database and presents matches.
3. User selects a match (or enters custom nutrition manually as a last resort).
4. Food is added to the list with verified nutrition data.

**Custom nutrition manual entry (last resort):**
If USDA lookup returns no results and no AI is available, the user can manually enter per-100g values:
- Calories (kcal)
- Protein (g)
- Carbohydrates (g)
- Fat (g)

This is gated behind a clear "Enter nutrition manually" action — it is not the default path.

#### 5.1.3 Food List Display

Each food in the session list displays:
| Field | Format |
|-------|--------|
| Name | String |
| Total weight | grams (always) |
| Total price | $X.XX |
| Cost per 100g | $X.XX |
| Calories per 100g | X kcal |
| Protein per 100g | Xg |
| Carbs per 100g | Xg |
| Fat per 100g | Xg |
| Source | "USDA" / "USDA API" / "Manual" |

Users can remove individual foods from the list. Users can inline-edit price and weight after adding (nutrition data remains from USDA unless manually overridden).

### 5.2 Goal Configuration

#### 5.2.1 Daily Macro Targets

Four configurable targets, each with a numeric input:

| Target | Unit | Default |
|--------|------|---------|
| Calories | kcal | 2500 |
| Protein | g | 180 |
| Carbohydrates | g | 250 |
| Fat | g | 70 |

Defaults are stored in localStorage and updated when the user changes them — so the next session starts with their last-used targets.

#### 5.2.2 Weekly Budget

- Input: maximum weekly food budget in USD.
- Default: $100.
- The optimizer divides by 7 to derive the daily budget constraint.

#### 5.2.3 Tolerance

- Single slider: 1% to 20%.
- Controls how much the optimizer may undershoot or overshoot each macro target.
- Default: 5%.
- Stored in localStorage.

**Constraint generation example (5% tolerance, 180g protein target):**
- Minimum protein: 171g
- Maximum protein: 189g

### 5.3 Optimization

#### 5.3.1 Solver

Client-side linear programming using `javascript-lp-solver`.

**Objective:** Minimize total daily food cost.

**Decision variables:** Grams of each food to consume per day.

**Constraints:**
| Constraint | Type | Formula |
|-----------|------|---------|
| Calories | Range | target × (1 - tolerance) ≤ Σ(food_cal_per_g × grams) ≤ target × (1 + tolerance) |
| Protein | Range | target × (1 - tolerance) ≤ Σ(food_pro_per_g × grams) ≤ target × (1 + tolerance) |
| Carbs | Range | target × (1 - tolerance) ≤ Σ(food_carb_per_g × grams) ≤ target × (1 + tolerance) |
| Fat | Range | target × (1 - tolerance) ≤ Σ(food_fat_per_g × grams) ≤ target × (1 + tolerance) |
| Daily budget | Upper bound | Σ(food_cost_per_g × grams) ≤ weekly_budget / 7 |
| Per-food max | Upper bound | Each food ≤ 1500g per day |
| Non-negativity | Lower bound | Each food ≥ 0g |

**Minimum foods required:** 2. The UI disables the optimize button and displays an inline message until at least 2 foods are in the list.

#### 5.3.2 Infeasibility Handling

When the solver returns no feasible solution:

1. The system runs diagnostic checks by relaxing one constraint category at a time (budget, then each macro) and re-solving.
2. It identifies which constraint(s) are causing infeasibility.
3. It presents specific, bounded suggestions:
   - "Increase weekly budget by ~$X to find a solution"
   - "Reduce protein target by ~Xg to find a solution"
   - "Increase tolerance to X% to find a solution"
   - "Add more food options — current foods cannot cover your macro targets"
4. Suggestions are limited to ±25% of the original constraint value. If relaxation beyond 25% is needed, the message is: "Your targets and budget are too far apart — adjust your goals or add more food options."

### 5.4 Results Dashboard

Displayed after successful optimization. The UI scrolls smoothly to this section.

#### 5.4.1 Summary Metrics (Top Cards)

| Metric | Format |
|--------|--------|
| Daily cost | $X.XX |
| Weekly cost | $X.XX (daily × 7) |
| Weekly budget remaining | $X.XX |
| Foods used | X of Y total |

#### 5.4.2 Optimal Daily Plan (Table)

| Column | Format |
|--------|--------|
| Food name | String |
| Daily amount | Xg |
| Daily cost | $X.XX |
| Calories | X kcal |
| Protein | Xg |
| Carbs | Xg |
| Fat | Xg |

Sorted by daily amount descending. Includes a totals row.

#### 5.4.3 Weekly Shopping List (Table)

| Column | Format |
|--------|--------|
| Food name | String |
| Weekly amount | Xg (and kg if ≥ 1000g) |
| Weekly cost | $X.XX |

Sorted by weekly cost descending.

#### 5.4.4 Nutrient Achievement Chart

Horizontal bar chart (Recharts) comparing achieved vs. target for each macro:
- Green bar: achieved value is within tolerance range.
- Red bar: achieved value is outside tolerance range (should not occur with a feasible solution, but included for transparency).
- Gray reference line: target value.
- Tolerance band shown as a shaded region on each bar.

#### 5.4.5 Export

**PDF Export:**
- Single button: "Export as PDF".
- Generates a PDF containing: summary metrics, daily plan table, weekly shopping list, and the date of generation.
- Uses client-side PDF generation (jsPDF + autoTable or equivalent).
- File name: `nutricost-plan-YYYY-MM-DD.pdf`

**Copy to Clipboard:**
- Button: "Copy Plan" — copies the daily plan and shopping list as formatted plain text to the clipboard.
- Optimized for mobile (uses Clipboard API).
- Format:
  ```
  NutriCostOptimizer Plan — 2026-04-01
  Daily Cost: $12.34 | Weekly Cost: $86.38

  DAILY PLAN
  Chicken breast      450g    $4.98
  White rice           380g    $0.95
  Eggs                 200g    $1.66
  ...

  WEEKLY SHOPPING LIST
  Chicken breast      3,150g (3.15kg)    $34.86
  White rice          2,660g (2.66kg)     $6.65
  ...
  ```

### 5.5 Settings Panel

Accessible via a gear icon in the header. Slides in as a side panel or modal on mobile.

#### 5.5.1 AI Configuration

| Field | Type | Persisted |
|-------|------|-----------|
| API Endpoint URL | text | localStorage |
| API Key | password | localStorage (optional — can also be set server-side via env var) |
| Model Name | text | localStorage |
| Enable AI Input | toggle | localStorage |

When AI is disabled or unconfigured, the app defaults to structured manual input mode. A clear status indicator shows whether AI is connected ("AI: Connected" / "AI: Not configured").

#### 5.5.2 Default Preferences

| Field | Type | Persisted |
|-------|------|-----------|
| Default calorie target | number | localStorage |
| Default protein target | number | localStorage |
| Default carbs target | number | localStorage |
| Default fat target | number | localStorage |
| Default weekly budget | number | localStorage |
| Default tolerance % | number | localStorage |

These populate the goal configuration fields at the start of each session.

---

## 6. UI/UX Specifications

### 6.1 Layout

**Mobile-first responsive design.**

**Mobile (< 768px):**
- Single-column stacked layout.
- Food input at top, goal config below, optimize button, results below.
- Settings accessible via header icon → full-screen modal.
- All tables horizontally scrollable if needed.

**Tablet (768px – 1024px):**
- Two-column layout: food input + goal config side by side, results full-width below.

**Desktop (> 1024px):**
- Sidebar (food input + goal config) | Main panel (results dashboard).
- Sidebar is ~400px fixed width; results panel fills remaining space.

### 6.2 Interaction Design

- **Food input** is the first and most prominent element. The text field is auto-focused on load.
- **Optimize button** is large, prominent, and fixed-position on mobile (bottom of screen) when foods ≥ 2.
- **Loading states**: Skeleton loaders for AI parsing and USDA lookups. Spinner on optimize button during solve.
- **Confirmation step**: After AI parses a food, the result is shown in an inline card with "Add" and "Edit" actions. No food is added without user confirmation.
- **Inline editing**: Tap/click any editable field (price, weight) in the food list to edit in place.
- **Delete**: Swipe-to-delete on mobile, X button on desktop.
- **Results scroll**: Smooth scroll to results section after optimization completes.
- **Empty states**: Clear messaging when no foods added, when AI is not configured, when optimization hasn't been run yet.

### 6.3 Visual Design

- Clean, minimal interface. White/light gray background, dark text.
- Accent color for primary actions (optimize button, add food).
- Monospace or tabular numerals for all numeric data in tables.
- No unnecessary decoration. Content density optimized for scanning.
- Dark mode: not in initial scope, but Tailwind class structure should not preclude it.

### 6.4 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 2.5s |
| AI parse round-trip | < 3s (network-dependent) |
| USDA local search | < 100ms |
| LP solver execution | < 500ms for ≤ 50 foods |
| Lighthouse mobile score | ≥ 90 |

---

## 7. Data

### 7.1 Local USDA Database

**Source:** USDA FoodData Central — Foundation Foods and SR Legacy datasets.

**Scope:** Pre-loaded with the ~2,000–5,000 most commonly purchased grocery items, focused on:
- Raw proteins (chicken, beef, pork, turkey, fish, eggs)
- Grains and starches (rice, oats, pasta, bread, potatoes)
- Dairy (milk, cheese, yogurt, butter)
- Legumes (beans, lentils, chickpeas)
- Vegetables and fruits
- Oils and fats
- Common processed items (protein powder, peanut butter, canned tuna)

**Schema:**
```sql
CREATE TABLE foods (
    fdc_id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT,
    calories_per_100g REAL NOT NULL,
    protein_per_100g REAL NOT NULL,
    carbs_per_100g REAL NOT NULL,
    fat_per_100g REAL NOT NULL,
    source TEXT DEFAULT 'local',  -- 'local' or 'api'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_foods_description ON foods(description);
```

**Search:** Case-insensitive substring search with ranking. Returns top 10 matches. The search should handle common abbreviations and plurals.

### 7.2 USDA FoodData Central API (Fallback)

- Endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search`
- Requires a free API key (configured via `USDA_API_KEY` env var).
- Triggered only when local DB search returns no results.
- Results are cached into the local SQLite database for future lookups.
- Rate limit: 1,000 requests/hour (free tier). More than sufficient for individual use.

### 7.3 localStorage Schema

```json
{
  "nutricost_preferences": {
    "ai": {
      "endpoint": "https://api.openai.com/v1/chat/completions",
      "model": "gpt-4o-mini",
      "key": "sk-...",
      "enabled": true
    },
    "defaults": {
      "calories": 2500,
      "protein": 180,
      "carbs": 250,
      "fat": 70,
      "budget": 100,
      "tolerance": 5
    }
  }
}
```

---

## 8. API Specifications

### 8.1 POST /api/parse

Proxies natural language food input to the configured AI API.

**Request:**
```json
{
  "input": "chicken breast 3lbs 15 dollars",
  "ai_config": {
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-4o-mini",
    "key": "sk-..."
  }
}
```

`ai_config` is optional. If omitted, the server uses its environment variables (`AI_API_URL`, `AI_API_KEY`, `AI_MODEL`). If provided, the per-request config takes precedence (enables browser-only key storage).

**Response (success):**
```json
{
  "name": "chicken breast",
  "weight_g": 1360.78,
  "price_usd": 15.00,
  "original_input": "chicken breast 3lbs 15 dollars"
}
```

**Response (error):**
```json
{
  "error": "Could not parse input. Please try again or use manual entry.",
  "details": "AI response did not contain required fields."
}
```

**AI System Prompt (sent with each request):**
```
You are a food input parser. Extract the following from the user's input:
- name: the food item name (lowercase, no quantities)
- weight: the numeric weight value
- weight_unit: one of "g", "kg", "oz", "lb"
- price: the numeric price in USD

Respond ONLY with a JSON object. Examples:
Input: "chicken breast 3lbs 15 dollars"
Output: {"name": "chicken breast", "weight": 3, "weight_unit": "lb", "price": 15.00}

Input: "2 dozen eggs 4.99"
Output: {"name": "eggs", "weight": 24, "weight_unit": "unit", "price": 4.99}

If you cannot parse the input, respond with: {"error": "unparseable"}
```

**Unit-specific handling:** When `weight_unit` is `"unit"` (e.g., eggs, bananas), the backend looks up a standard unit weight from a small reference table (1 large egg = 50g, 1 medium banana = 118g, etc.). If not found, returns an error asking the user to specify weight.

### 8.2 GET /api/foods/search

Searches for foods by name, returns nutritional data.

**Query parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | yes | Search query |
| limit | int | no | Max results (default 10) |

**Response:**
```json
{
  "results": [
    {
      "fdc_id": 171077,
      "description": "Chicken breast, boneless, skinless, raw",
      "category": "Poultry",
      "per_100g": {
        "calories": 120,
        "protein_g": 22.5,
        "carbs_g": 0,
        "fat_g": 2.6
      },
      "source": "local_db"
    }
  ],
  "query": "chicken breast",
  "total": 1
}
```

If local DB returns 0 results and `USDA_API_KEY` is configured, the backend queries the USDA API, caches results, and returns them with `"source": "usda_api"`.

### 8.3 GET /api/health

Returns service status. Used by Docker health checks and the frontend AI status indicator.

**Response:**
```json
{
  "status": "ok",
  "ai_configured": true,
  "usda_api_configured": true,
  "local_foods_count": 3847
}
```

---

## 9. Error Handling

| Scenario | Behavior |
|----------|----------|
| AI API unreachable | Show toast: "AI service unavailable. Switching to manual input." Auto-toggle to structured input mode. |
| AI returns unparseable response | Show toast: "Couldn't parse that. Try rephrasing or use manual input." Display the original input in the text field for editing. |
| USDA local search: no results | Silently try USDA API fallback. |
| USDA API fallback: no results | Show inline message: "Food not found in database. You can enter nutrition manually." Reveal manual nutrition fields. |
| USDA API: rate limited or down | Show toast: "USDA service unavailable. You can enter nutrition manually." |
| Optimizer: infeasible | Show infeasibility panel with specific suggestions (see §5.3.2). |
| Optimizer: < 2 foods | Disable optimize button. Inline message: "Add at least 2 foods to optimize." |
| Network offline | Detect via `navigator.onLine`. Show persistent banner. Local DB search and optimization still work. AI parsing and USDA API fallback disabled. |
| localStorage full/unavailable | Graceful degradation — app works without persistence, preferences reset each session. |

---

## 10. Project Structure

```
nutricostoptimizer/
├── docker-compose.yml
├── Dockerfile
├── .env.example                     # Template for environment variables
│
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── requirements.txt
│   ├── routers/
│   │   ├── parse.py                 # POST /api/parse
│   │   ├── foods.py                 # GET /api/foods/search
│   │   └── health.py                # GET /api/health
│   ├── services/
│   │   ├── ai_proxy.py              # OpenAI-compatible API client
│   │   ├── food_search.py           # Local DB + USDA API fallback
│   │   └── unit_conversion.py       # Weight unit → grams conversion
│   ├── db/
│   │   ├── database.py              # SQLite connection management
│   │   ├── seed.py                  # Script to build initial USDA database
│   │   └── unit_weights.json        # Standard weights for unit-based items
│   └── data/
│       └── foods.db                 # Pre-built SQLite database (in Docker volume)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root component
│   │   ├── types.ts                 # TypeScript interfaces
│   │   ├── constants.ts             # Defaults, unit conversions
│   │   ├── store/
│   │   │   └── preferences.ts       # localStorage read/write
│   │   ├── components/
│   │   │   ├── FoodInput.tsx         # NL + structured input
│   │   │   ├── FoodList.tsx          # Food inventory with inline edit
│   │   │   ├── GoalConfig.tsx        # Macro targets + budget + tolerance
│   │   │   ├── ResultsDashboard.tsx  # Summary, tables, chart
│   │   │   ├── SettingsPanel.tsx     # AI config + default preferences
│   │   │   └── InfeasibilityPanel.tsx# Constraint relaxation suggestions
│   │   ├── services/
│   │   │   ├── api.ts               # HTTP client for backend endpoints
│   │   │   ├── optimizer.ts         # LP solver wrapper
│   │   │   └── exporter.ts          # PDF generation + clipboard copy
│   │   └── hooks/
│   │       ├── usePreferences.ts    # localStorage hook
│   │       └── useFoodSearch.ts     # Debounced search hook
│   └── public/
│       └── favicon.ico
│
└── scripts/
    └── seed_usda.py                 # Downloads USDA data and builds foods.db
```

---

## 11. Implementation Priorities

### Phase 1 — Core (MVP)
1. Backend: FastAPI with `/api/foods/search` (local SQLite only), `/api/health`.
2. Frontend: Structured manual food input, goal config, LP optimizer, results table.
3. Docker Compose deployment.
4. USDA database seeding script with ~2,000 common foods.

### Phase 2 — AI & Polish
5. Backend: `/api/parse` AI proxy endpoint.
6. Frontend: Natural language input mode, AI config in settings.
7. USDA API fallback integration.
8. Infeasibility diagnostics with suggestions.

### Phase 3 — Export & UX
9. PDF export.
10. Copy-to-clipboard.
11. Nutrient achievement chart.
12. Mobile UX refinements (swipe-to-delete, fixed optimize button, scroll behavior).
13. Performance optimization and Lighthouse audit.

---

## 12. Acceptance Criteria

The application is considered complete when:

1. A user can open the app on a mobile browser, add foods via natural language or manual entry, set macro targets, and receive a cost-optimized daily plan — all in under 2 minutes.
2. Nutritional data comes from USDA (local DB or API), not AI estimation.
3. The optimizer produces a valid solution that meets all macro targets within tolerance and stays within budget, or provides specific actionable suggestions when infeasible.
4. The app deploys with `docker compose up` and no additional setup beyond providing API keys in `.env`.
5. Preferences persist across browser sessions via localStorage.
6. The daily plan and shopping list are exportable as PDF and copiable as plain text.
7. The app scores ≥ 90 on Lighthouse mobile performance audit.
8. All food quantities in results are displayed in grams.
