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
 * @evidence contracts/development/design.md#principled-representation Reports the KKT residuals of the original program at the returned point, primal feasibility, stationarity of `H·x + q + Aᵀ·y` and complementarity, so admission reads the actual conditions rather than the solver's normalized measures or status alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The solution, the three admission residuals and the diagnostics a failed solve's error message prints, the native report, row groups and the polishing attempt, in one record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Polishing can replace the solution only through full-row admission and never changes `status`, so no residual or status is massaged into success.
 * @evidence contracts/development/common.md#meaningful-documentation States when the solution is the native one or the polished candidate, that the status is never promoted, the caller's admission rule, ownership, and each residual's formula and unit.
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
