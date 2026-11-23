import type { IAutoMovieMotionHumanAcrobatics } from "@automovie/interface";

/**
 * The round-off led with the left hand: the left hand goes down first. Spread into
 * `roundOff`'s parameters; the `roundOffLeft` row of `HumanGymnastics` fixes this value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hand the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The round-off's own leading hand as one `IRoundOffPreset`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanAcrobatics.ROUND_OFF_LEFT`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_ACROBATICS_ROUND_OFF_LEFT: IAutoMovieMotionHumanAcrobatics.IRoundOffPreset =
  {
    lead: "left",
  };
