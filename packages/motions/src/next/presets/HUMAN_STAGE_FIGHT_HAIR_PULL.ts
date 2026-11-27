import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The hair pull preset: one squeeze of the palm held for 1.5 s. The `hairPull`
 * row of `HumanStageFight` reads it, so the row and the preset share one
 * value.
 */
export const HUMAN_STAGE_FIGHT_HAIR_PULL: IAutoMovieMotionHumanStageFight.IHoldPreset =
  { effector: "palm", kind: "squeeze", count: 1, hold: 1.5 };
