import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A kinematic beat for a performer carrying a digital stage prop. The law
 * reads the held prop's local marks and places a visible pose on a cue.
 * Performer reactions are independent authored actions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the beat kind, held model, mark, support hand site, clock and virtual placement.
 * @evidence contracts/development/design.md#principled-representation The closed beat selects a path on an existing body and rigid prop. Placement and contact frames retain their existing owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stage law reads the action, hand, optional stage point, mark, second hand site and authored time.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional target is a world-space set point. The contract carries no actor target, damage, or force.
 */
export interface IAutoMovieMotionHumanStageProp {
  /** Look of the stage beat. */
  beat:
    | "figureEight"
    | "overheadCircle"
    | "block"
    | "yield"
    | "boss"
    | "rim"
    | "offset"
    | "linked";

  /** Scene id of the digital prop the performer already holds. */
  prop: string;

  /** Main holding hand. Right when absent. */
  hand?: AutoMovieHumanSide;

  /** Prop-local mark id. Uses the selected beat's mark when absent. */
  mark?: string;

  /** Grip site id for the other hand as a support on the same prop. */
  support?: string;

  /** Optional point in the virtual set, in world metres, for the visible accent with the stance planted. */
  at?: IAutoMovieVector3;

  /**
   * Staged time in seconds. Defaults to the beat's authored time.
   * Exclusive minimum: 0. Unit: seconds.
   */
  seconds?: number;
}
