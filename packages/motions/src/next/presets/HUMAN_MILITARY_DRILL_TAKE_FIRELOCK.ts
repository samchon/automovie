import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The take firelock preset: the musket taken by its butt with the left hand.
 * The `takeFirelock` row of `HumanMusketDrill` reads it, so the row and the
 * preset share one value.
 */
export const HUMAN_MILITARY_DRILL_TAKE_FIRELOCK: IAutoMovieMotionHumanMilitaryDrill.IFirelockGripPreset =
  { handle: "butt", hand: "left" };
