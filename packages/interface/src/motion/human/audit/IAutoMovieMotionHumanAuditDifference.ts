import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * How far two displayed motions are apart: the largest distance between the
 * same joint centre of both at the same film second.
 *
 * Three properties of a motion are stated as a difference of two runs:
 *
 * - Determinism: the same seed and the same chain give a difference of zero;
 * - Seed sensitivity: another seed gives a difference above zero when the action
 *   varies, and still a clean audit;
 * - Left and right symmetry: the motion of the mirrored order (every side
 *   swapped) is the mirror image of the first, so with `mirror` the second
 *   motion is reflected in the sagittal plane `x = plane` and its left bones
 *   are compared with the first one's right bones.
 *
 * The two motions are read over the shorter one's length, and the difference of
 * their lengths is reported beside the distance, since two motions that agree
 * while both last still differ when one is longer.
 */
export namespace IAutoMovieMotionHumanAuditDifference {
  /** How the second motion is read against the first. */
  export interface IOptions {
    /** The person in the second motion; the first one's subject by default. */
    other?: string;

    /**
     * The lateral coordinate of the sagittal plane the second motion is
     * reflected in; absent for no reflection.
     */
    mirror?: number;

    /** Grid samples per second; 24 by default. */
    rate?: number;
  }

  /** Read how far two motions are apart. The reading of {@link measure}. */
  export interface IResult {
    /** The largest distance between the same joint centre, metres. */
    distance: IAutoMovieMotionHumanAuditMeasure;

    /** The absolute difference of the two lengths, seconds. */
    duration: number;
  }
}
