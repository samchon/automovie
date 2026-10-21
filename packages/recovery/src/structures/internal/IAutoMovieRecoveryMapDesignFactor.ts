import type { IAutoMovieSingularDecomposition } from "@automovie/engine/math/IAutoMovieSingularDecomposition";

/**
 * Column-scaled original design factors, before any requested step synthesis.
 *
 * @evidence contracts/common.md#principled-implementation Positive column scales and optional tall-design QR precede SVD of the original undamped design; no damping supplies rank.
 * @evidence contracts/common.md#clear-and-simple-design A full solver consumes the factors, while a metric-only consumer immediately takes the qualified ratio and releases the rest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rank result is neither an LS step nor a nonlinear convergence certificate.
 * @evidence contracts/common.md#meaningful-documentation Fields state original versus compressed coordinates and borrowed-right aliasing in the short branch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no factorization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned O(m*C+C^2) rows/scales/SVD arrays live in one operation; solveRows may alias rows and uncompressed solveRight borrows the caller's right side.
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
