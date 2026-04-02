export interface NutritionPer100g {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodItem {
  id: string;
  name: string;
  weight_g: number;
  price_usd: number;
  nutrition: NutritionPer100g;
  source: "local_db" | "usda_api" | "manual";
  fdc_id?: number;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GoalConfig {
  targets: MacroTargets;
  weeklyBudget: number;
  tolerance: number;
}

export interface OptimizationResult {
  feasible: boolean;
  dailyCost: number;
  foods: OptimizedFood[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface OptimizedFood {
  name: string;
  grams: number;
  dailyCost: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface InfeasibilityDiagnostic {
  constraint: string;
  suggestion: string;
  adjustedValue?: number;
}

export interface FoodSearchResult {
  fdc_id: number;
  description: string;
  category: string | null;
  per_100g: NutritionPer100g;
  source: string;
}

export interface Preferences {
  ai: {
    endpoint: string;
    model: string;
    key: string;
    enabled: boolean;
  };
  defaults: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    budget: number;
    tolerance: number;
  };
}
