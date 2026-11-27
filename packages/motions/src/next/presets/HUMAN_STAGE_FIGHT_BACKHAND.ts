import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The backhand preset: one tap of the hand's back swept across the target. The
 * `backhand` row of `HumanStageFight` reads it, so the row and the preset share
 * one value.
 */
export const HUMAN_STAGE_FIGHT_BACKHAND: IAutoMovieMotionHumanStageFight.ITapPreset =
  { effector: "handBack", kind: "tap", count: 1, tangent: "across" };
