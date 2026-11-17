import type {
  IAutoMovieRecoveryFeasibleFit,
  IAutoMovieRecoveryFeasibleProblem,
  IAutoMovieRecoverySqpOptions,
  IAutoMovieSimplexBudget,
} from "../../index";

/**
 * Refine one caller-defined State while preserving the correlation between the problem callbacks and returned state. maxTrials bounds actual nonlinear evaluations; tolerance controls original-coordinate normal KKT termination. The direction budget bounds each numerical direction solve. Synchronous checkpoint and charge callbacks may throw to stop; acceleration is absent by default. No tiny step, accepted trial or exhausted budget establishes convergence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for refineRecoveryFeasibleState.
 * @evidence contracts/development/design.md#principled-representation Refine one caller-defined State while preserving the correlation between the problem callbacks and returned state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface refineRecoveryFeasibleState and its typed callers share this signature and the referenced canonical input and result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by refineRecoveryFeasibleState; the type does not certify input validity.
 */
export namespace IAutoMovieRecoveryFeasibleStateRefinementOperation {
  /**
   * Refine one caller-defined State while preserving the correlation between the problem callbacks and returned state. maxTrials bounds actual nonlinear evaluations; tolerance controls original-coordinate normal KKT termination. The direction budget bounds each numerical direction solve. Synchronous checkpoint and charge callbacks may throw to stop; acceleration is absent by default. No tiny step, accepted trial or exhausted budget establishes convergence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents parameter units, callback effects and failed admission for refineRecoveryFeasibleState.
   * @evidence contracts/development/design.md#principled-representation Refine one caller-defined State while preserving the correlation between the problem callbacks and returned state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface refineRecoveryFeasibleState and its typed callers share this signature and the referenced canonical input and result records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical qualification and caller budget admission remain required by refineRecoveryFeasibleState; the type does not certify input validity.
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
