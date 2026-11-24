import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The grabbed preset: the trunk giving way toward the grip. The `grabbed` row
 * of `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_GRABBED: IAutoMovieMotionHumanStageFight.IGivePreset =
  { part: "trunk", way: "toward" };
