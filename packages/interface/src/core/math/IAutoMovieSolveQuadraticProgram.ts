import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";
import type { IAutoMovieSolveQuadraticKernel } from "./IAutoMovieSolveQuadraticKernel";

/**
 * Sparse diagonal objectives and original-coordinate diagnostics for solving
 * and refinement.
 */
export namespace IAutoMovieSolveQuadraticProgram {
  /**
   * Borrowed program minimizing 0.5*sum(diagonal[i]*x[i]^2)+sum(linear[i]*x[i])
   * under inclusive sparse row bounds. Coefficient units follow the caller's
   * variable, objective and row units; no geometric conversion occurs.
   *
   * AdmitAutoMovieQuadraticProgram requires 1..2^31-1 variables and at most
   * 2^31-1 rows, complete aligned vectors, nonnegative diagonal, unique
   * resident row indices, ordered bounds and finite scalars with magnitude
   * below 1e30. Container shape and allocatable aggregate storage remain
   * caller/host premises. Admission does not establish feasibility or
   * convergence.
   */
  export type IInput = {
    /**
     * Nonnegative diagonal P of the objective, one coefficient per variable;
     * zero is allowed.
     */
    diagonal: readonly number[];

    /**
     * Linear q coefficients with the same variable order and length as
     * diagonal.
     */
    linear: readonly number[];

    /**
     * Inclusive sparse bounds on A*x in caller-defined row units; an empty list
     * means no row constraints.
     */
    rows: readonly IAutoMovieQuadraticRow[];

    /**
     * Optional complete variable vector admitted like linear. The current
     * kernel ignores it and starts cold; omission never reuses a previous
     * solution.
     */
    initial?: readonly number[];
  };

  /**
   * Kernel status and copied mutable primal/dual arrays plus unnormalized
   * original-problem residuals. Status 1 alone denotes full kernel convergence;
   * other statuses and unavailable/nonfinite diagnostics remain observable.
   * Callers choose tolerances in their units and verify geometry after later
   * transforms.
   */
  export type IResult = IAutoMovieSolveQuadraticKernel.IResult & {
    /**
     * Maximum of zero and each lower-minus-A_x or A_x-minus-upper excess. Row
     * units must be made comparable by the caller; failed vectors may produce
     * nonfinite results.
     */
    maximumViolation: number;

    /**
     * Maximum absolute component of P_x+q+A-transpose_dual in original
     * objective-gradient units, without normalization or an acceptance
     * threshold.
     */
    stationarityResidual: number;
  };
}
