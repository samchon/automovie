import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The dive for cover preset: a prone lie down held for 3 s. The `diveForCover`
 * row of `HumanStageFight` reads it, so the row and the preset share one
 * value.
 */
export const HUMAN_STAGE_FIGHT_DIVE_FOR_COVER: IAutoMovieMotionHumanStageFight.IDivePreset =
  { kind: "prone", hold: 3 };
