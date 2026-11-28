import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
} from "..";

/**
 * Owned settings for explicit feasible scene refinement. Declared limits remain
 * available for the returned report, while execution can reserve capacity for
 * routing and diagnostics.
 */
export interface IAutoMovieRecoverySceneFeasibleRouting {
  /** Owned copy of the caller's original scene ceilings, reported in the result. */
  declared: IAutoMovieRecoveryCameraSceneBudget;

  /**
   * Owned working ceilings after routing reservations and any admitted
   * reporting retention.
   */
  execution: IAutoMovieRecoveryCameraSceneBudget;

  /**
   * Copied method flags and direction budgets, with fit retention limited to
   * execution capacity.
   */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /**
   * Report capacity acquired inside the initial transaction after relative seed
   * acceptance, if available.
   */
  reporting?: IAutoMovieRecoveryFeasibleReportCapacity;
}
