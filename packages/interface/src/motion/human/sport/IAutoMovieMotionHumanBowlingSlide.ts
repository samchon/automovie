import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * The final glide of a one-handed ten-pin bowling approach: the foot opposite
 * the delivery hand slides forward under load, brakes, and the trailing foot
 * steps up to a recovery plant.
 *
 * Events: `slideStarted`, `slideStopped` and `recoveryPlant`, on the action
 * clock. A delivery overlays the arms on this lower-body base.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the act, its events, and that the delivery owns the arms while this law owns the legs and root.
 * @evidence contracts/development/design.md#principled-representation The parameters are action-local seconds and metres; the order 0 < from < to < seconds and the body-scaled distance are runtime admission in bowlingSlide.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the bowlingSlide law and the sportThrow lexicon row map.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The delivery hand reuses the canonical side type instead of a local union.
 */
export namespace IAutoMovieMotionHumanBowlingSlide {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, clock and default.
   * @evidence contracts/development/design.md#principled-representation The glide distance, the three action-local instants and the delivery side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values bowlingSlide.plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ordering and reach cannot be typed and are refused by the law with the feasible range.
   */
  export interface IParams {
    /** Forward glide in metres, positive and at most 0.4 of combined thigh and shank length. */
    distance: number;

    /** Action-local slide onset in seconds, strictly after zero. */
    from: number;

    /** Action-local slide end in seconds, after onset and before `seconds`. */
    to: number;

    /** Total action-local seconds, including the recovery plant. */
    seconds: number;

    /** Delivery hand, `right` when absent. The other foot leads the glide. */
    hand?: AutoMovieHumanSide;
  }
}
