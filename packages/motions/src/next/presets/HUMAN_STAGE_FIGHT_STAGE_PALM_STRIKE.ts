import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The stage palm strike preset: the rear palm heel driven at the target and
 * stopped short at 0.85 of its delivery (provisional), with no contact
 * declared. The `stagePalmStrike` row of `HumanStageFight` reads it, so the row
 * and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanStageFight.IStagePunchPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStageFight.STAGE_PALM_STRIKE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE: IAutoMovieMotionHumanStageFight.IStagePunchPreset =
  { technique: "palmHeel", hand: "rear", feint: 0.85 };
