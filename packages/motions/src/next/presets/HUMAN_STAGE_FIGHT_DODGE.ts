import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The dodge preset: one step to the right. The `dodge` row of `HumanStageFight`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_DODGE: IAutoMovieMotionHumanStageFight.IFootworkPreset =
  { direction: "right", steps: 1 };
