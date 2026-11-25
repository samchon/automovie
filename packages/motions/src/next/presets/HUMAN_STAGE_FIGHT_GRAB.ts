import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The grab preset: one squeeze of the palm. The `grab` row of `HumanStageFight`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_GRAB: IAutoMovieMotionHumanStageFight.IPressPreset =
  { effector: "palm", kind: "squeeze", count: 1 };
