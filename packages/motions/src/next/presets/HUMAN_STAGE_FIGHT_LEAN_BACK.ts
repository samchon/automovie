import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The lean back preset: the trunk giving way away from the threat. The
 * `leanBack` row of `HumanStageFight` reads it, so the row and the preset share
 * one value.
 */
export const HUMAN_STAGE_FIGHT_LEAN_BACK: IAutoMovieMotionHumanStageFight.IGivePreset =
  { part: "trunk", way: "away" };
