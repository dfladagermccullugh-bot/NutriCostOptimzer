import { useState, useCallback } from "react";
import type { Preferences } from "../types";
import { loadPreferences, savePreferences } from "../store/preferences";

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(loadPreferences);

  const setPreferences = useCallback((updater: Preferences | ((prev: Preferences) => Preferences)) => {
    setPreferencesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      savePreferences(next);
      return next;
    });
  }, []);

  return [preferences, setPreferences] as const;
}
