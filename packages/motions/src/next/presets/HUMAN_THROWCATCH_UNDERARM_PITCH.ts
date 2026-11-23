import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * A softball pitch or a bowling-style lob: the underarm style, release 40
 * degrees after a 0.45 s windup. Spread into `throwObject`'s parameters with
 * the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IAutoMovieMotionHumanThrowCatch.IStylePreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanThrowCatch.UNDERARM_PITCH`; the `underarmPitch` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_THROWCATCH_UNDERARM_PITCH: IAutoMovieMotionHumanThrowCatch.IStylePreset =
  { style: "underarm" };
