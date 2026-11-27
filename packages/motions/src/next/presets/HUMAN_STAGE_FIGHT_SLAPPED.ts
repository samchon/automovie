import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The slapped preset: the head giving way from the blow. The `slapped` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_SLAPPED: IAutoMovieMotionHumanStageFight.IGivePreset =
  { part: "head", way: "away" };
