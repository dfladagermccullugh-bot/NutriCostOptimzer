FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directory for SQLite DB
RUN mkdir -p /app/data

# Seed the database
ENV DB_PATH=/app/data/foods.db
RUN python -m backend.db.seed

EXPOSE 8080

# Honor Railway's injected $PORT in production; default to 8080 locally.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
