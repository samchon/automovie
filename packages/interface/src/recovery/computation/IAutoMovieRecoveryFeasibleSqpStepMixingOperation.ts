import type {
  IAutoMovieRecoverySqpMix,
  IAutoMovieSimplexAtom,
} from "../../index";

/**
 * Mix two physical direction vectors under every original affine inequality.
 * nominal is the caller's dimensionless mixture coefficient. The result retains
 * that nominal attempt separately from at most one computed support candidate;
 * a null step means neither directly checked candidate qualified. Inputs remain
 * borrowed and no objective or geometry callback runs.
 */
export namespace IAutoMovieRecoveryFeasibleSqpStepMixingOperation {
  /**
   * Mix two physical direction vectors under every original affine inequality.
   * nominal is the caller's dimensionless mixture coefficient. The result
   * retains that nominal attempt separately from at most one computed support
   * candidate; a null step means neither directly checked candidate qualified.
   * Inputs remain borrowed and no objective or geometry callback runs.
   */
  export type Operation = (
    rows: readonly IAutoMovieSimplexAtom[],
    sqp: readonly number[],
    tilted: readonly number[],
    nominal: number,
  ) => IAutoMovieRecoverySqpMix;
}
