import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether a body is back where it was: how far the joint centres of one instant
 * are from the same centres of an earlier instant.
 *
 * An action that says it returns to its entry (a wave that lowers the arm
 * again, a squat that stands back up, a punch that comes back to guard) shows
 * the entry's body at its end. Two readings tell the two ways that can fail
 * apart. `world` is the largest distance between a joint centre at the two
 * instants as displayed, so it also reads a body that kept its form but drifted
 * or turned. `shape` reads the same after each instant's centres are expressed
 * in that instant's own pelvis frame (origin at the hips, axes the hips'
 * orientation), so it reads the body's form alone: a walker who ends in the
 * stance they began in, two metres on and facing another way, has a `shape` of
 * zero and a `world` of two metres.
 */
export namespace IAutoMovieMotionHumanAuditReturn {
  /** What the reading found. */
  export interface IResult {
    /**
     * The largest distance between a joint centre at the two instants, world
     * frame, metres, with the bone, at the later instant.
     */
    world: IAutoMovieMotionHumanAuditMeasure;

    /** The same in each instant's own pelvis frame, metres. */
    shape: IAutoMovieMotionHumanAuditMeasure;
  }
}
