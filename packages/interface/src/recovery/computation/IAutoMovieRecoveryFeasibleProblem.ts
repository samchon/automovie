import type {
  IAutoMovieRecoveryFeasibleModel,
  IAutoMovieRecoveryUntiltedEstimate,
} from "../../index";

/** Fixed-population recovery objective with an owned retraction and exact gates. */
export interface IAutoMovieRecoveryFeasibleProblem<State> {
  /** Feasible initial state, borrowed without mutation. */
  initial: State;

  /** Evaluate the actual fixed-population objective and all nonlinear gates. */
  evaluate: (state: State) => number | null;

  /** Build the current original-rank-qualified physical and metric model. */
  linearize: (state: State) => IAutoMovieRecoveryFeasibleModel;

  /** Produce a detached actual trial using the current physical tangent step. */
  retract: (state: State, step: readonly number[]) => State;

  /** Measure selected original inequalities at one actual failed full trial. */
  constraintValues?: (state: State, rows: readonly number[]) => number[] | null;

  /**
   * Explicitly request a charged borrowed untilted estimate on selected
   * updates; true requires accepted. Absence retains the four-argument reaction
   * and no wrapper work.
   */
  requestUntiltedEstimate?: boolean;

  /** Notify the owner once about a selected qualified local update. */
  accepted?: (
    base: State,
    increment: readonly number[],
    oldCost: number,
    newCost: number,
    estimate?: IAutoMovieRecoveryUntiltedEstimate | null,
  ) => void;
}
