import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The aim preset: a point held for 1.5 s. The `aim` row of `HumanDrill` reads
 * it, so the row and the preset share one value.
 */
export const HUMAN_MILITARY_DRILL_AIM: IAutoMovieMotionHumanMilitaryDrill.IAimPreset =
  { kind: "point", hold: 1.5 };
