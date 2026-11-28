import type { AutoMovieVector3Tuple } from "../index";

/** Right-handed physical cutting frame with a plane origin and three unit axes. */
export interface IAutoMoviePlaneFrame {
  /**
   * Physical point on the cutting plane in the source Cartesian frame. The
   * constructor reuses the caller's tuple.
   */
  origin: AutoMovieVector3Tuple;

  /** Unit oriented plane normal in the source Cartesian frame. */
  n: AutoMovieVector3Tuple;

  /** First unit in-plane axis, chosen so u cross v agrees with n. */
  u: AutoMovieVector3Tuple;

  /** Second unit in-plane axis aligned with the normalized projected reference. */
  v: AutoMovieVector3Tuple;
}
