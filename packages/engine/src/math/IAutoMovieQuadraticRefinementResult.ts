import { IAutoMovieQuadraticPolishingResult } from "./IAutoMovieQuadraticPolishingResult";
import { IAutoMovieQuadraticRefinementNativeCall } from "./IAutoMovieQuadraticRefinementNativeCall";

/**
 * The solution `refineAutoMovieQuadraticProgram` returns for a diagonal
 * quadratic program, with its residuals measured on every original row.
 *
 * `primal` and `dual` are the native solution unless polishing produced a
 * finite candidate that passed the caller's threshold on every original row;
 * then they are that candidate. `status` is always the native status, so an
 * unsuccessful solve is never promoted. The caller admits the solution only
 * when `status` is 1 and the three residuals are within its tolerance. All
 * arrays are new and owned by the caller.
 *
 * @evidence contracts/common.md#principled-implementation Reports the KKT residuals of the original program at the returned point, primal feasibility, stationarity of `H·x + q + Aᵀ·y` and complementarity, so admission reads the actual conditions rather than the solver's normalized measures or status alone.
 * @evidence contracts/common.md#clear-and-simple-design The solution, the three admission residuals and the diagnostics a failed solve's error message prints, the native report, row groups and the polishing attempt, in one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Polishing can replace the solution only through full-row admission and never changes `status`, so no residual or status is massaged into success.
 * @evidence contracts/common.md#meaningful-documentation States when the solution is the native one or the polished candidate, that the status is never promoted, the caller's admission rule, ownership, and each residual's formula and unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record with no algorithm; the cost is answered on `refineAutoMovieQuadraticProgram`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The refinement report carries one native call and its optional polishing trace, all measured against the same original coefficients; it coordinates no solver sharing across programs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the caller: vectors of the variable and row counts, one ordinal per row in `rowGroups`, and the optional polishing traces bounded by the budget.
 */
export interface IAutoMovieQuadraticRefinementResult {
  /** Returned primal, one value per program variable. */
  primal: number[];

  /**
   * Returned multipliers in original row order, positive on an active upper
   * endpoint and negative on an active lower endpoint.
   */
  dual: number[];

  /** Native status, unchanged by polishing; 1 is Solved. */
  status: number;

  /** Largest endpoint violation over all original rows, in row units. */
  maximumViolation: number;

  /** Infinity norm of `H·x + q + Aᵀ·y`, with every original row in `A`. */
  stationarityResidual: number;

  /**
   * Largest `|y · (a·x − endpoint)|` over the rows, using the endpoint the
   * multiplier's sign selects, `|y|` when that endpoint is unbounded, and 0
   * for an equality row.
   */
  complementarityResidual: number;

  /** Polishing steps taken; 0 when polishing did not run. */
  refinements: number;

  /** Copy of the native primal, kept even when a polished one is returned. */
  reference: number[];

  /** Original row numbers of each group of identical coefficient rows. */
  rowGroups: number[][];

  /** The single native solve the refinement started from. */
  nativeCalls: IAutoMovieQuadraticRefinementNativeCall[];

  /**
   * The polishing attempt; absent when the native status is not 1, the budget
   * is 0, or the native solution already passed admission.
   */
  polishing?: IAutoMovieQuadraticPolishingResult;
}
