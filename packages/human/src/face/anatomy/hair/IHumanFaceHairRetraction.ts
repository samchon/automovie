import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point carried to a requested free offset from the same hair collider,
 * returned by the `retract` reader of `humanFaceHairContact`.
 *
 * The point lies at the requested offset along the outward normal of its
 * closest skin hit, and a second query confirms that offset within epsilon
 * and at least the free clearance. Concave or ambiguous geometry that never
 * settles refuses instead of returning.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRetraction {
  /** Retracted position at the requested offset, in current head-frame metres. */
  point: IAutoMovieVector3;

  /** Unit outward skin normal at the hit that placed `point`. */
  normal: IAutoMovieVector3;
}
