import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The take firelock preset: the musket taken by its butt with the left hand. The `takeFirelock` row of `HumanMusketDrill` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanMilitaryDrill.IFirelockGripPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanMilitaryDrill.TAKE_FIRELOCK`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_MILITARY_DRILL_TAKE_FIRELOCK: IAutoMovieMotionHumanMilitaryDrill.IFirelockGripPreset =
  { handle: "butt", hand: "left" };
