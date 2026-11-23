import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A two-handed backhand drive. Spread into the cut's parameters; the row adds the implement's measured speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanSwing.IGripPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanSwing.TWO_HAND_BACKHAND`; the `twoHandBackhand` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_SWING_TWO_HAND_BACKHAND: IAutoMovieMotionHumanSwing.IGripPreset =
  { from: "backhand", hands: 2 };
