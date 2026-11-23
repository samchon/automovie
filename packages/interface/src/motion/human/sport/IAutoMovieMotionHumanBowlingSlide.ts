import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * The final glide of a one-handed ten-pin bowling approach: the foot opposite
 * the delivery hand slides forward under load, brakes, and the trailing foot
 * steps up to a recovery plant.
 *
 * Events: `slideStarted`, `slideStopped` and `recoveryPlant`, on the action
 * clock. A delivery overlays the arms on this lower-body base.
 */
export namespace IAutoMovieMotionHumanBowlingSlide {
  /** Parameters. */
  export interface IParams {
    /**
     * Forward glide in metres, positive and at most 0.4 of combined thigh and
     * shank length.
     */
    distance: number;

    /** Action-local slide onset in seconds, strictly after zero. */
    from: number;

    /** Action-local slide end in seconds, after onset and before `seconds`. */
    to: number;

    /** Total action-local seconds, including the recovery plant. */
    duration: number;

    /** Delivery hand, `right` when absent. The other foot leads the glide. */
    hand?: AutoMovieHumanSide;
  }
}
