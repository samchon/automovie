import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import type { IAutoMovieSolveQuadraticKernel } from "./IAutoMovieSolveQuadraticKernel";

/**
 * Sparse diagonal objectives and original-coordinate diagnostics for solving and refinement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sparse diagonal objectives and original-coordinate diagnostics for solving and refinement. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation A sparse PSD objective retains caller units and results extend canonical kernel diagnostics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Quadratic solving, polishing and refinement share the same input/result contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Admission, convergence and post-transform geometric validity remain distinct obligations.
 */
export namespace IAutoMovieSolveQuadraticProgram {
  /**
   * Borrowed program minimizing 0.5*sum(diagonal[i]*x[i]^2)+sum(linear[i]*x[i]) under inclusive sparse row bounds. Coefficient units follow the caller's variable, objective and row units; no geometric conversion occurs.
   *
   * admitAutoMovieQuadraticProgram requires 1..2^31-1 variables and at most 2^31-1 rows, complete aligned vectors, nonnegative diagonal, unique resident row indices, ordered bounds and finite scalars with magnitude below 1e30. Container shape and allocatable aggregate storage remain caller/host premises. Admission does not establish feasibility or convergence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the objective, alignment, numeric admission, ownership and ignored compatibility vector.
   * @evidence contracts/development/design.md#principled-representation A diagonal PSD objective and sparse interval rows preserve the original problem; null endpoints represent unbounded sides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Solving, original-coordinate refinement and polishing share this program and the canonical row contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero coefficients and semidefinite diagonals remain unchanged; invalid scalars/holes are refused, and geometry acceptance tolerances stay with the caller.
   */
  export type IInput = {
    /** Nonnegative diagonal P of the objective, one coefficient per variable; zero is allowed. */
    diagonal: readonly number[];

    /** Linear q coefficients with the same variable order and length as diagonal. */
    linear: readonly number[];

    /** Inclusive sparse bounds on A*x in caller-defined row units; an empty list means no row constraints. */
    rows: readonly IAutoMovieQuadraticRow[];

    /** Optional complete variable vector admitted like linear. The current kernel ignores it and starts cold; omission never reuses a previous solution. */
    initial?: readonly number[];
  };

  /**
   * Kernel status and copied mutable primal/dual arrays plus unnormalized original-problem residuals. Status 1 alone denotes full kernel convergence; other statuses and unavailable/nonfinite diagnostics remain observable. Callers choose tolerances in their units and verify geometry after later transforms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes status from original-row/gradient residuals and states ownership and acceptance responsibility.
   * @evidence contracts/development/design.md#principled-representation Bound excess and infinity-norm stationarity retain row and objective-gradient units, unlike normalized kernel residuals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical kernel result is extended only by the two original-problem measurements used in refinement and geometric solving.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed/incomplete statuses and vectors remain visible; objective decrease or finite residuals are not geometric validity certificates.
   */
  export type IResult = IAutoMovieSolveQuadraticKernel.IResult & {
    /** Maximum of zero and each lower-minus-A*x or A*x-minus-upper excess. Row units must be made comparable by the caller; failed vectors may produce nonfinite results. */
    maximumViolation: number;

    /** Maximum absolute component of P*x+q+A-transpose*dual in original objective-gradient units, without normalization or an acceptance threshold. */
    stationarityResidual: number;
  };
}
