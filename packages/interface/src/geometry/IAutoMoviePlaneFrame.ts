import type { AutoMovieVector3Tuple } from "../index";

/** Right-handed physical cutting frame: u cross v = n, all axes unit. */
export interface IAutoMoviePlaneFrame {
  /** Physical point on the plane in the source Cartesian frame. */
  origin: AutoMovieVector3Tuple;

  /** Unit normal whose direction fixes the orientation convention. */
  n: AutoMovieVector3Tuple;

  /** First unit in-plane axis; u cross v equals n. */
  u: AutoMovieVector3Tuple;

  /** Second unit in-plane axis, orthogonal to u and n. */
  v: AutoMovieVector3Tuple;
}
