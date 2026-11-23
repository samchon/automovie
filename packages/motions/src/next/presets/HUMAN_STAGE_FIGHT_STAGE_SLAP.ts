import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The stage slap preset: one tap of the open palm swept across the target, half a hand's length clear of it (provisional), with no contact declared. The `stageSlap` row of `HumanStageFight` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanStageFight.IStageSlapPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStageFight.STAGE_SLAP`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STAGE_FIGHT_STAGE_SLAP: IAutoMovieMotionHumanStageFight.IStageSlapPreset =
  { effector: "palm", kind: "tap", count: 1, tangent: "across", clear: 0.5 };
