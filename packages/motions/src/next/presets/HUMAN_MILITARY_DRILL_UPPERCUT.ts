import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The uppercut preset: an uppercut thrown by the rear hand. The `uppercut` row
 * of `HumanDrill` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanMilitaryDrill.IPunchPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanMilitaryDrill.UPPERCUT`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_MILITARY_DRILL_UPPERCUT: IAutoMovieMotionHumanMilitaryDrill.IPunchPreset =
  { technique: "uppercut", hand: "rear" };
