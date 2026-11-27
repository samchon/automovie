import type {
  IAutoMovieRecoveryFeasibleFit,
  IAutoMovieRecoveryFeasibleProblem,
  IAutoMovieRecoverySqpOptions,
  IAutoMovieSimplexBudget,
} from "..";

/**
 * Refine one caller-defined State while preserving the correlation between the
 * problem callbacks and returned state. maxTrials bounds actual nonlinear
 * evaluations; tolerance controls original-coordinate normal KKT termination.
 * The direction budget bounds each numerical direction solve. Synchronous
 * checkpoint and charge callbacks may throw to stop; acceleration is absent by
 * default. No tiny step, accepted trial or exhausted budget establishes
 * convergence.
 */
export namespace IAutoMovieRecoveryFeasibleStateRefinementOperation {
  /**
   * Refine one caller-defined State while preserving the correlation between
   * the problem callbacks and returned state. maxTrials bounds actual nonlinear
   * evaluations; tolerance controls original-coordinate normal KKT termination.
   * The direction budget bounds each numerical direction solve. Synchronous
   * checkpoint and charge callbacks may throw to stop; acceleration is absent
   * by default. No tiny step, accepted trial or exhausted budget establishes
   * convergence.
   */
  export type Operation<State> = (
    problem: IAutoMovieRecoveryFeasibleProblem<State>,
    maxTrials: number,
    tolerance: number,
    directionBudget: IAutoMovieSimplexBudget,
    checkpoint: () => void,
    charge: (work: number) => void,
    acceleration?: IAutoMovieRecoverySqpOptions,
  ) => IAutoMovieRecoveryFeasibleFit<State>;
}
