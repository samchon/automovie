import type { IAutoMovieSingularDecomposition } from "../../index";

/** Column-scaled original design factors, before any requested step synthesis. */
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
