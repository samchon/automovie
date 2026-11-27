import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The duck preset: a partial crouch held for 0.3 s. The `duck` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_DUCK: IAutoMovieMotionHumanStageFight.ICrouchPreset =
  { depth: "partial", hold: 0.3 };
