import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * A high cricket release toward the authored pitch bounce: the cricket style,
 * release 4 degrees below the horizontal after a 0.42 s windup. Spread into
 * `throwObject`'s parameters with the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanThrowCatch.IStylePreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanThrowCatch.CRICKET_BOWL`; the `cricketBowl` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_THROWCATCH_CRICKET_BOWL: IAutoMovieMotionHumanThrowCatch.IStylePreset =
  { style: "cricket" };
