import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The pushed preset: the trunk giving way from a push at half intensity. The
 * `pushed` row of `HumanStageFight` reads it, so the row and the preset share
 * one value.
 */
export const HUMAN_STAGE_FIGHT_PUSHED: IAutoMovieMotionHumanStageFight.IPushedPreset =
  { part: "trunk", way: "away", intensity: 0.5 };
