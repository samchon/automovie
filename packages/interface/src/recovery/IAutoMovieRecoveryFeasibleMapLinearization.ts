import type {
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieSimplexAtom,
} from "..";

/** Matching robust original-design blocks and unweighted physical constraints. */
export interface IAutoMovieRecoveryFeasibleMapLinearization {
  /** Weighted original point/camera Jacobian rows for every landmark. */
  blocks: IAutoMovieRecoveryMapJointBlock[];

  /**
   * Physical objective gradient first, then every unweighted disk derivative
   * with offset minus g.
   */
  rows: IAutoMovieSimplexAtom[];
}
