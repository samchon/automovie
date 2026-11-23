import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * A goalkeeper's or a receiver's catch in both hands. Spread into `catchObject`'s parameters with the anchor of the throw caught.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanThrowCatch.IHandsPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanThrowCatch.TWO_HAND_CATCH`; the `twoHandCatch` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_THROWCATCH_TWO_HAND_CATCH: IAutoMovieMotionHumanThrowCatch.IHandsPreset =
  { hands: "two" };
