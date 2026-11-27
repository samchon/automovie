import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Angular transition half-width fields and sample-selection inputs in metres
 * and radians. Runtime construction and admission remain with
 * AutoMovieHumanJointTransition in Human.
 */
export namespace IAutoMovieHumanJointTransition {
  /** A half width by the angle about a plane's normal. */
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

  /** What one transition is measured from. */
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
