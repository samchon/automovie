import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Orthonormal clinical flexion, abduction and twist axes in a bone's rest
 * frame. Runtime construction and admission remain with
 * AutoMovieHumanSkeletonMath in Human.
 */
export namespace IAutoMovieHumanSkeletonMath {
  /** Three orthonormal clinical axes of one bone in its rest frame. */
  export interface IAxes {
    /** Axis flexion turns about. */
    flexion: AutoMovieVector3Tuple;

    /** Axis abduction turns about. */
    abduction: AutoMovieVector3Tuple;

    /** Axis twist turns about, the long axis. */
    twist: AutoMovieVector3Tuple;
  }
}
