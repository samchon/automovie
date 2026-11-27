import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The slap preset: one tap of the open palm swept across the target. The `slap`
 * row of `HumanStageFight` reads it, so the row and the preset share one
 * value.
 */
export const HUMAN_STAGE_FIGHT_SLAP: IAutoMovieMotionHumanStageFight.ITapPreset =
  { effector: "palm", kind: "tap", count: 1, tangent: "across" };
