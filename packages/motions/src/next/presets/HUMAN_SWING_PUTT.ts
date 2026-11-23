import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A golf putt or chip: both hands, a level stroke along the ground line. Spread into the cut's parameters; the row adds the implement's measured speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanSwing.IGripPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanSwing.PUTT`; the `putt` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_SWING_PUTT: IAutoMovieMotionHumanSwing.IGripPreset = {
  from: "forehand",
  hands: 2,
};
