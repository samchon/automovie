import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A bunt: the bat held level before the body in both hands. Spread into the
 * cut's parameters; the row adds the implement's measured speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanSwing.IBuntPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanSwing.BUNT`; the `bunt` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_SWING_BUNT: IAutoMovieMotionHumanSwing.IBuntPreset = {
  guard: "middle",
  hands: 2,
};
