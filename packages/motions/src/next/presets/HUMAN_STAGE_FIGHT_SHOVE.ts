import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The shove preset: one press of the palm. The `shove` row of `HumanStageFight`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_SHOVE: IAutoMovieMotionHumanStageFight.IPressPreset =
  { effector: "palm", kind: "press", count: 1 };
