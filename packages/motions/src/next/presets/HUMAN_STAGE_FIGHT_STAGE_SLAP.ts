import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The stage slap preset: one tap of the open palm swept across the target, half
 * a hand's length clear of it (provisional), with no contact declared. The
 * `stageSlap` row of `HumanStageFight` reads it, so the row and the preset
 * share one value.
 */
export const HUMAN_STAGE_FIGHT_STAGE_SLAP: IAutoMovieMotionHumanStageFight.IStageSlapPreset =
  { effector: "palm", kind: "tap", count: 1, tangent: "across", clear: 0.5 };
