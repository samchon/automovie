import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * The same kick with the left foot. Spread into `kickBall`'s parameters with
 * the ball.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanThrowCatch.IFootPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanThrowCatch.KICK_LEFT`; the `kickLeft` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_THROWCATCH_KICK_LEFT: IAutoMovieMotionHumanThrowCatch.IFootPreset =
  { foot: "left" };
