import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The restrain preset: a clinch held for 3 s. The `restrain` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_RESTRAIN: IAutoMovieMotionHumanStageFight.IClinchPreset =
  { hold: 3 };
