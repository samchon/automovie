import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One trial chord at the station where a rooted stem refused.
 *
 * The exterior interval along `direction` was certified up to `bound` metres
 * (`bounded` when a surface ended it before the station's nominal chord). For a
 * clipped trial, `reached` is the certified interior point the progress rule
 * tested, with its clearance, nearest triangle and outward normal.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemTrial {
  /** Unit trial direction. */
  direction: IAutoMovieVector3;

  /** Certified travel along the direction, in metres. */
  bound: number;

  /** Whether a surface ended the interval before the nominal chord. */
  bounded: boolean;

  /** The certified interior point the progress rule tested. */
  reached: IAutoMovieVector3;

  /** Signed free distance of `reached`. */
  reachedClearance: number;

  /** Original collider triangle nearest `reached`. */
  reachedTriangle: number;

  /** Unit outward normal of the skin nearest `reached`. */
  blocking: IAutoMovieVector3;
}
