import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The uppercut preset: an uppercut thrown by the rear hand. The `uppercut` row
 * of `HumanDrill` reads it, so the row and the preset share one value.
 */
export const HUMAN_MILITARY_DRILL_UPPERCUT: IAutoMovieMotionHumanMilitaryDrill.IPunchPreset =
  { technique: "uppercut", hand: "rear" };
