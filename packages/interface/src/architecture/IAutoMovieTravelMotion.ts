import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The single degree of freedom one moving member travels on.
 *
 * Door leaves and lift cars share this record because their arithmetic is the
 * same: the value a named operating state gives is a displacement from the
 * element's own rest pose, and the engine composes it after that pose so it
 * rides down the element hierarchy. Rest is the value `0`, so every range
 * contains it.
 */
export type IAutoMovieTravelMotion =
  | IAutoMovieTravelMotion.IRevolute
  | IAutoMovieTravelMotion.IPrismatic;
/** Revolute and prismatic travel alternatives of one moving member. */
export namespace IAutoMovieTravelMotion {
  /**
   * A hinge: the member turns about an axis through a pivot.
   *
   * A positive value turns counter-clockwise when viewed from the tip of the
   * axis looking back at the pivot, the right-hand rule.
   */
  export interface IRevolute {
    /** Selects the hinge joint. */
    kind: "revolute";

    /**
     * Finite non-zero turn axis in the moving element's own local frame; only
     * its direction matters, because the engine normalizes it.
     */
    axis: IAutoMovieVector3;

    /** Finite point on that axis, in the same local frame, that stays fixed. */
    pivot: IAutoMovieVector3;

    /** Lowest travel in radians; finite and at most `0`, the rest value. */
    min: number;

    /**
     * Highest travel in radians; finite, at least zero, greater than `min`, and
     * at most `2 * Math.PI + 1e-6` above it under the shared full-turn
     * admission slack.
     */
    max: number;
  }

  /** A slide: the member travels along an axis without turning. */
  export interface IPrismatic {
    /** Selects the slide joint. */
    kind: "prismatic";

    /**
     * Finite non-zero travel axis in the moving element's own local frame; only
     * its direction matters, because the engine normalizes it.
     */
    axis: IAutoMovieVector3;

    /** Lowest travel in metres along the unit axis; finite and at most `0`. */
    min: number;

    /**
     * Highest travel in metres along the unit axis; finite, at least `0`, and
     * strictly greater than `min`.
     */
    max: number;
  }
}
