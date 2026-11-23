import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * The low delivery of a one-handed ten-pin bowling approach: the bowling style, release 1 degree below the horizontal after a 0.58 s windup, along the lane. Spread into `throwObject`'s parameters with the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanThrowCatch.IStylePreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBowling.DELIVERY`; the `bowlingDelivery` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BOWLING_DELIVERY: IAutoMovieMotionHumanThrowCatch.IStylePreset =
  { style: "bowling" };
