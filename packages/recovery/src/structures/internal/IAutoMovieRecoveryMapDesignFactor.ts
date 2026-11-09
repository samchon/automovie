import type { IAutoMovieSingularDecomposition } from "@automovie/engine";

/**
 * Column-scaled original design factors, before any requested step synthesis.
 *
 * @evidence contracts/development/design.md#principled-representation Positive column scales and optional tall-design QR precede SVD of the original undamped design; no damping supplies rank.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A full solver consumes the factors, while a metric-only consumer immediately takes the qualified ratio and releases the rest.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rank result is neither an LS step nor a nonlinear convergence certificate.
 * @evidence contracts/development/common.md#meaningful-documentation Fields state original versus compressed coordinates and borrowed-right aliasing in the short branch.
 */
export interface IAutoMovieRecoveryMapDesignFactor {
  /** Positive norms restoring the original design's column units. */
  scales: number[];

  /** Owned complete column-normalized original rows. */
  rows: number[][];

  /** Owned compressed rows, or the same rows object in the short branch. */
  solveRows: number[][];

  /** Matching compressed right, or borrowed original right in the short branch. */
  solveRight: readonly number[];

  /** Independently qualified undamped original-design SVD. */
  rank: IAutoMovieSingularDecomposition;

  /** Undamped normalized smallest/largest singular ratio. */
  designRatio: number;
}
