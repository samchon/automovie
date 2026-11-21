import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * A sudden lunge that closes both hands on a victim's region, as a shambler
 * breaks from its walk: the front foot steps long, the trunk pitches
 * forward and the hands close on the region through the stage-fight grab.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the step, the reach and the grab it ends in.
 * @evidence contracts/development/design.md#principled-representation The victim and the region named, one leading side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `lungeGrab` law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A region beyond the lunge's reach is refused with the distance named.
 */
export namespace IAutoMovieMotionHumanLungeGrab {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation Subject id, region and side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `lungeGrab.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reach is the step plus the arms, measured on the body.
   */
  export interface IParams {
    /** The victim. */
    partner: string;

    /** The victim's region the hands close on; `shoulderLeft` and `shoulderRight` together when absent. */
    region?: AutoMovieHumanoidRegion;

    /** The leg that steps into the lunge; the right when absent. */
    side?: AutoMovieHumanSide;
  }
}
