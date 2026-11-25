import type { IAutoMovieHumanBonePlacement } from "./IAutoMovieHumanBonePlacement";
import type { IAutoMovieHumanPoseClamp } from "./IAutoMovieHumanPoseClamp";

/**
 * Independent requested placements and every canonical clamp, without
 * exterior/rest materialization.
 */
export interface IAutoMovieHumanPoseProjection {
  /**
   * Requested bones in canonical parent-before-child order; arrays and tuples
   * are owned.
   */
  posed: IAutoMovieHumanBonePlacement[];

  /**
   * All requested out-of-range clinical fields, including those outside the
   * selected branches.
   */
  clamped: IAutoMovieHumanPoseClamp[];
}
