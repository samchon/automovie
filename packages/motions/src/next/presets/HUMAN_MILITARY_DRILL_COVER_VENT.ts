import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The cover vent preset: the fingertips held on the gun's vent. The `coverVent` row of `HumanGunDrill` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanMilitaryDrill.ICoverVentPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanMilitaryDrill.COVER_VENT`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_MILITARY_DRILL_COVER_VENT: IAutoMovieMotionHumanMilitaryDrill.ICoverVentPreset =
  { effector: "fingertips", kind: "hold" };
