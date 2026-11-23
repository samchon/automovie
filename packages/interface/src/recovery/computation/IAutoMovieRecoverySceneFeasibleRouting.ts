import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
} from "../../index";

/**
 * Fixed owned scene method state, excluding the existing cumulative work
 * ledger.
 */
export interface IAutoMovieRecoverySceneFeasibleRouting {
  /** Owned original ceilings, transferred directly to the returned result. */
  declared: IAutoMovieRecoveryCameraSceneBudget;

  /**
   * Owned execution ceilings after routing and, once acquired, reporting
   * retention.
   */
  execution: IAutoMovieRecoveryCameraSceneBudget;

  /**
   * Owned nested scalar options, with fit retention capped by execution
   * capacity.
   */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /**
   * Acquired only after relative-seed acceptance, inside the seed transaction
   * try.
   */
  reporting?: IAutoMovieRecoveryFeasibleReportCapacity;
}
