import type { Preferences } from "../types";
import { DEFAULT_PREFERENCES } from "../constants";

const STORAGE_KEY = "nutricost_preferences";

export function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed, ai: { ...DEFAULT_PREFERENCES.ai, ...parsed.ai }, defaults: { ...DEFAULT_PREFERENCES.defaults, ...parsed.defaults } };
    }
  } catch {
    // Graceful degradation
  }
  return { ...DEFAULT_PREFERENCES };
}

export function savePreferences(prefs: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage full or unavailable — ignore
  }
}
