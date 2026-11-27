import type { IAutoMovieRecoveryEventCompilationPolicy } from "..";

/** Local chart budgets and aggregate field-complex admission limits. */

export interface IAutoMovieRecoveryFieldComplexPolicy extends IAutoMovieRecoveryEventCompilationPolicy {
  /** Positive safe-integer limit on admitted chart declarations. */
  maxCharts: number;

  /** Positive safe-integer limit on native coefficient owners. */
  maxNativeOwners: number;

  /** Positive safe-integer aggregate patch budget. */
  maxTotalPatches: number;
}
