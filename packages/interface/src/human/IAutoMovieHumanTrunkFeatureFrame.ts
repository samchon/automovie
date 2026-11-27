import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * The wall origin and orthogonal outward/up/lateral frame used by a trunk
 * relief. Runtime construction and admission remain with
 * AutoMovieHumanTrunkFeatureFrame in Human.
 */
export namespace IAutoMovieHumanTrunkFeatureFrame {
  /** A feature's frame. */
  export interface IFrame {
    /** The feature's centre on the wall, mm. */
    origin: AutoMovieVector3Tuple;

    /** Unit axis the height is measured along, outward. */
    axis: AutoMovieVector3Tuple;

    /** Unit in-plane axis, the feature's up, perpendicular to the axis. */
    up: AutoMovieVector3Tuple;

    /** Unit in-plane axis toward the body's left, `axis x up`. */
    lateral: AutoMovieVector3Tuple;
  }
}
