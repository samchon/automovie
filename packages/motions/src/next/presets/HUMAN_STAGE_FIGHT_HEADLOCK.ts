import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The headlock preset: a clinch held for 2 s. The `headlock` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_HEADLOCK: IAutoMovieMotionHumanStageFight.IClinchPreset =
  { hold: 2 };
