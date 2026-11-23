import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The backhand preset: one tap of the hand's back swept across the target. The `backhand` row of `HumanStageFight` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanStageFight.ITapPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStageFight.BACKHAND`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STAGE_FIGHT_BACKHAND: IAutoMovieMotionHumanStageFight.ITapPreset =
  { effector: "handBack", kind: "tap", count: 1, tangent: "across" };
