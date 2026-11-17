import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanJointTransition; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanJointTransition {
  /** A half width by the angle about a plane's normal.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A half width by the angle about a plane's normal.
   * @evidence contracts/development/design.md#principled-representation `u`: First axis square to the normal, where the angle is zero. `v`: Second axis square to the normal, a quarter turn on. `terms`: Mean, then cosine and sine of the angle and of twice it, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanJointTransition.measure. Read by AutoMovieHumanJointTransition.half.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `u`, `v`, `terms`, `least`, `most`; callers supply the complete record.
   */
  export interface ISectors {
    /** First axis square to the normal, where the angle is zero. */
    u: AutoMovieVector3Tuple;

    /** Second axis square to the normal, a quarter turn on. */
    v: AutoMovieVector3Tuple;

    /** Mean, then cosine and sine of the angle and of twice it, metres. */
    terms: [number, number, number, number, number];

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }

  /** What one transition is measured from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What one transition is measured from.
   * @evidence contracts/development/design.md#principled-representation `points`: Skin samples, metres, three numbers each. `held`: Whether a sample belongs to the joint's two bones and side. `at`: The plane's point, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanJointTransition.measure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `held`, `at`, `normal`, `turn`, `least`, `most`; callers supply the complete record.
   */
  export interface IMeasure {
    /** Skin samples, metres, three numbers each. */
    points: Float64Array;

    /** Whether a sample belongs to the joint's two bones and side. */
    held: (index: number) => boolean;

    /** The plane's point, metres. */
    at: AutoMovieVector3Tuple;

    /** The plane's unit normal toward the child. */
    normal: AutoMovieVector3Tuple;

    /** The joint's largest turn from the bind, radians. */
    turn: number;

    /** Least half width, metres. */
    least: number;

    /** Greatest half width, metres. */
    most: number;
  }
}
