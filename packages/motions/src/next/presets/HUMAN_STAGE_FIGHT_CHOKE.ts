import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The choke preset: one squeeze of the palm held for 2 s. The `choke` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_CHOKE: IAutoMovieMotionHumanStageFight.IHoldPreset =
  { effector: "palm", kind: "squeeze", count: 1, hold: 2 };
