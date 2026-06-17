import type { FoodItem } from "../types";

/**
 * Single source of truth for "is this food usable in analysis?" (audit F1/C1).
 * A food must have a positive weight, a positive price, and at least one non-zero macro.
 * Anything else (e.g. a zero-price item from an AI parse) would corrupt cost math and is excluded.
 */
export function isUsableFood(f: FoodItem): boolean {
  const n = f.nutrition;
  const hasMacros = n.calories > 0 || n.protein_g > 0 || n.carbs_g > 0 || n.fat_g > 0;
  return f.weight_g > 0 && f.price_usd > 0 && hasMacros;
}
