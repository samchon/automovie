import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The aim preset: a point held for 1.5 s. The `aim` row of `HumanDrill` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanMilitaryDrill.IAimPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanMilitaryDrill.AIM`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_MILITARY_DRILL_AIM: IAutoMovieMotionHumanMilitaryDrill.IAimPreset =
  { kind: "point", hold: 1.5 };
