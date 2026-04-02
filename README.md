# NutriCostOptimizer

A self-hostable web application that generates **cost-minimized daily meal plans** satisfying user-defined macronutrient targets. Built for bodybuilders and macro-trackers who weigh food and track grocery costs.

## Quick Start

```bash
# Clone and run
git clone https://github.com/dfladagermccullugh-bot/NutriCostOptimzer.git
cd NutriCostOptimzer
cp .env.example .env          # Edit with your API keys (optional)
docker compose up
```

Open [http://localhost:8080](http://localhost:8080).

## How It Works

1. **Add foods** with price and weight — via natural language AI parsing or manual entry
2. **Set macro targets** — calories, protein, carbs, fat, weekly budget, tolerance
3. **Optimize** — a client-side linear programming solver finds the cheapest daily meal plan meeting your targets
4. **Export** — download as PDF or copy to clipboard

## Features

- **200 pre-loaded USDA foods** with verified nutritional data
- **USDA FoodData Central API fallback** for foods not in the local database
- **Natural language input** via any OpenAI-compatible AI API (optional)
- **Client-side LP solver** — no server round-trip for optimization
- **Infeasibility diagnostics** — actionable suggestions when no solution exists
- **Mobile-first** responsive design with swipe-to-delete
- **No accounts, no login** — preferences stored in browser localStorage
- **PDF export** and **clipboard copy** for meal plans

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Charts | Recharts |
| Solver | javascript-lp-solver (client-side) |
| Backend | FastAPI (Python) |
| Database | SQLite (USDA food data) |
| PDF | jsPDF + autoTable |
| Deploy | Docker + Docker Compose |

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_API_KEY` | No | OpenAI-compatible API key for natural language input |
| `AI_API_URL` | No | AI API endpoint URL |
| `AI_MODEL` | No | AI model name (default: gpt-4o-mini) |
| `USDA_API_KEY` | No | USDA FoodData Central API key for food lookup fallback |

The app works fully without any API keys — just use manual food entry and the pre-loaded USDA database.

## Development

```bash
# Backend
pip install -r backend/requirements.txt
python -m backend.db.seed                    # Seed the USDA database
uvicorn backend.main:app --port 8080         # Start the API server

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                                   # Vite dev server with API proxy
```

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── routers/                # API endpoints (/parse, /foods/search, /health)
│   ├── services/               # AI proxy, food search, unit conversion
│   └── db/                     # SQLite database, seed script, unit weights
├── frontend/
│   └── src/
│       ├── components/         # React components
│       ├── services/           # API client, LP optimizer, PDF/clipboard export
│       ├── hooks/              # usePreferences, useFoodSearch
│       └── store/              # localStorage persistence
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml          # One-command deployment
└── scripts/
    └── seed_usda.py            # Database seeding convenience script
```
