import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The esquiva preset: a full crouch held for 0.6 s. The `esquiva` row of
 * `HumanStageFight` reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_ESQUIVA: IAutoMovieMotionHumanStageFight.ICrouchPreset =
  { depth: "full", hold: 0.6 };
