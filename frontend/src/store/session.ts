import type { FoodItem, GoalConfig } from "../types";

// Persists the working basket + goals so an accidental reload doesn't wipe a session (audit H4).
// Preferences live separately in preferences.ts; this is the in-progress analysis state.
const STORAGE_KEY = "nutricost_session";

export interface SessionState {
  foods: FoodItem[];
  goals: GoalConfig | null;
}

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        foods: Array.isArray(parsed.foods) ? parsed.foods : [],
        goals: parsed.goals ?? null,
      };
    }
  } catch {
    // Corrupt or unavailable storage — start clean.
  }
  return { foods: [], goals: null };
}

export function saveSession(state: SessionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — ignore.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
