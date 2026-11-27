/**
 * The lift into a carry and the set-down out of it: the carried body leaves the
 * posture it was entered in for the carry's over the first `lift` seconds, and
 * over the last `setDown` seconds comes down to stand where the carrier has
 * brought it.
 *
 * The minimum-jerk transitions retain the carrier-relative held pose. A coupled
 * cradle shares acquisition and release timing between both roles. Stage the
 * carried person on planted feet within reach of the bearer's palms. Both palms
 * support the body before the first foot leaves and through set-down until the
 * feet have accepted the weight. The law refuses a staged transfer whose
 * prepared material surfaces cannot keep contact.
 */
export namespace IAutoMovieMotionHumanCarriedLift {
  /** The two phases' lengths. */
  export interface IParams {
    /**
     * Seconds the lift into the carry takes, at the start, at least 0; none
     * when absent.
     */
    lift?: number;

    /** Seconds the set-down takes, at the end, at least 0; none when absent. */
    setDown?: number;
  }
}
