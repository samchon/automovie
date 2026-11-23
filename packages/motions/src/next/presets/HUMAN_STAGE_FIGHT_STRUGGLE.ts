import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The struggle preset: one squeeze of the palm held for 1.5 s. The `struggle`
 * row of `HumanStageFight` reads it, so the row and the preset share one
 * value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanStageFight.IHoldPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStageFight.STRUGGLE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STAGE_FIGHT_STRUGGLE: IAutoMovieMotionHumanStageFight.IHoldPreset =
  { effector: "palm", kind: "squeeze", count: 1, hold: 1.5 };
