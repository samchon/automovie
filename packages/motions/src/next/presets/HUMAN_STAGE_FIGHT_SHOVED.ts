import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The shoved preset: a stagger at a speed of 0.8. The `shoved` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanStageFight.IShovedPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStageFight.SHOVED`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STAGE_FIGHT_SHOVED: IAutoMovieMotionHumanStageFight.IShovedPreset =
  { speed: 0.8 };
