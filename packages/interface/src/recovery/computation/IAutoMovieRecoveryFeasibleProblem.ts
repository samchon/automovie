import type {
  IAutoMovieRecoveryFeasibleModel,
  IAutoMovieRecoveryUntiltedEstimate,
} from "../../index";

/** Fixed-population recovery objective with an owned retraction and exact gates.
 *
 * @evidence contracts/development/design.md#principled-representation The actual objective, rank-qualified local metric and full nonlinear feasibility remain with the numerical owner; the controller chooses bounded directions and actual descent trials.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Named callbacks let the same controller exercise independent analytic charts and the actual gauge-fixed camera chart, without expected answers or fitted-state replacement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retraction returns detached state, and an infeasible evaluation returns null rather than deleting a residual or clamping depth.
 * @evidence contracts/development/common.md#meaningful-documentation Members state immutable input, null feasibility, same-population cost and model/work ownership.
 */
export interface IAutoMovieRecoveryFeasibleProblem<State> {
  /** Feasible initial state, borrowed without mutation. */
  initial: State;

  /** Evaluate the actual fixed-population objective and all nonlinear gates.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows state; returns a finite actual cost or null for infeasibility, with unexpected errors propagated.
   */
  evaluate: (state: State) => number | null;

  /** Build the current original-rank-qualified physical and metric model.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows state and transfers a model in the current physical tangent coordinates; numerical admission failures propagate.
   */
  linearize: (state: State) => IAutoMovieRecoveryFeasibleModel;

  /** Produce a detached actual trial using the current physical tangent step.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows state/step and returns a detached trial; feasibility is checked separately by evaluate.
   */
  retract: (state: State, step: readonly number[]) => State;

  /** Measure selected original inequalities at one actual failed full trial.
   * @evidence contracts/development/common.md#meaningful-documentation Borrows trial and increasing original row IDs excluding objective zero; returns owned raw g values or null when measurement is unsupported.
   */
  constraintValues?: (state: State, rows: readonly number[]) => number[] | null;

  /** Explicitly request a charged borrowed untilted estimate on selected updates; true requires accepted. Absence retains the four-argument reaction and no wrapper work. */
  requestUntiltedEstimate?: boolean;

  /** Notify the owner once about a selected qualified local update.
   * @evidence contracts/development/common.md#meaningful-documentation Base and increment are borrowed immutable for this call; costs belong to the chosen actual evaluation. Only an explicit request supplies the optional fifth argument: a current qualified affine estimate or null. Its readonly arrays are borrowed for this call and require a separately admitted owned copy. This local selection is neither normal convergence nor checkpoint acceptance.
   */
  accepted?: (
    base: State,
    increment: readonly number[],
    oldCost: number,
    newCost: number,
    estimate?: IAutoMovieRecoveryUntiltedEstimate | null,
  ) => void;
}
