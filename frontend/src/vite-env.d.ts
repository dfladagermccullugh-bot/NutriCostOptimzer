/// <reference types="vite/client" />

declare module "javascript-lp-solver" {
  interface SolverResult {
    feasible: boolean;
    result: number;
    bounded?: boolean;
    isIntegral?: boolean;
    [key: string]: any;
  }

  interface Model {
    optimize: string;
    opType: string;
    constraints: Record<string, { min?: number; max?: number }>;
    variables: Record<string, Record<string, number>>;
    ints?: Record<string, number>;
  }

  const solver: {
    Solve: (model: Model) => SolverResult;
  };

  export default solver;
}
