/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend base URL for Capacitor native builds (no trailing slash). Empty = relative /api (web/PWA). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
