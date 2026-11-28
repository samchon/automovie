import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the ViewJointedCourse operations. */
export namespace IAutoMovieViewJointedCourse {
  /**
   * Prepared turn about an interior centre of a jointed axis. The course uses a
   * rotation through angle over twice the physical half length. Setbacks
   * reserve the same distance on the adjoining segments. A straight joint has
   * zero length and a zero rotation vector.
   */
  export interface ITurn {
    /** Index of this interior point in the original centre list. */
    centre: number;

    /**
     * Half of the turn's arclength in millimetres. An exactly straight joint
     * stores zero.
     */
    half: number;

    /** Full rotation angle in radians between the adjacent segment directions. */
    angle: number;

    /**
     * Dimensionless unit rotation axis for an actual bend, or zero vector for a
     * straight joint.
     */
    axis: AutoMovieVector3Tuple;

    /**
     * Distance in millimetres reserved at this joint on each adjoining source
     * segment.
     */
    setback: number;

    /** Course arclength in millimetres at the first point of the turn. */
    start: number;
  }

  /**
   * Prepared centreline lengths, directions and turns for a jointed view axis.
   * Directions and lengths follow source segment order. Turns follow interior
   * centre order after the producer has checked angular and setback
   * constraints.
   */
  export interface ICourse {
    /** Unit vectors of consecutive source segments, in source order. */
    directions: AutoMovieVector3Tuple[];

    /**
     * Lengths of consecutive source segments in millimetres, before subtracting
     * turn setbacks.
     */
    lengths: number[];

    /** Prepared entries for each interior source centre, in centre order. */
    turns: IAutoMovieViewJointedCourse.ITurn[];
  }
}
