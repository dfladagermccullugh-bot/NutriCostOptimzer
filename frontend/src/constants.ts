import type { Preferences } from "./types";

export const DEFAULT_PREFERENCES: Preferences = {
  ai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    key: "",
    enabled: true,
  },
  defaults: {
    calories: 2500,
    protein: 180,
    carbs: 250,
    fat: 70,
    budget: 100,
    tolerance: 5,
  },
};

export const MAX_FOOD_GRAMS_PER_DAY = 1500;
export const MIN_FOODS_TO_OPTIMIZE = 2;
