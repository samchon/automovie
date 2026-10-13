import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The single degree of freedom one moving member travels on.
 *
 * A door leaf and a lift car are the same arithmetic under different names, so
 * they share one record rather than each growing a private one: the value a
 * named state gives is a displacement from the element's own rest pose, and the
 * engine composes it after that pose so it rides down the hierarchy.
 *
 * @author Samchon
 */
export type IAutoMovieTravelMotion =
  | IAutoMovieTravelMotion.IRevolute
  | IAutoMovieTravelMotion.IPrismatic;
export namespace IAutoMovieTravelMotion {
  /** A hinge: the member turns about an axis through a pivot. */
  export interface IRevolute {
    /** Discriminator. */
    kind: "revolute";

    /** Non-zero turn axis in the moving element's own local frame. */
    axis: IAutoMovieVector3;

    /** A point on that axis in the same local frame. */
    pivot: IAutoMovieVector3;

    /** Lowest travel in radians; at most `0`, because rest is `0`. */
    min: number;

    /**
     * Highest travel in radians; at least `0`, strictly greater than `min`, and
     * within a turn of `min`.
     */
    max: number;
  }

  /** A slide: the member travels along an axis without turning. */
  export interface IPrismatic {
    /** Discriminator. */
    kind: "prismatic";

    /** Non-zero travel axis in the moving element's own local frame. */
    axis: IAutoMovieVector3;

    /** Lowest travel in metres along the unit axis; at most `0`. */
    min: number;

    /**
     * Highest travel in metres along the unit axis; at least `0` and strictly
     * greater than `min`.
     */
    max: number;
  }
}
