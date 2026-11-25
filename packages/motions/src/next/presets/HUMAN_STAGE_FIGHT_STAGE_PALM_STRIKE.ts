import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The stage palm strike preset: the rear palm heel driven at the target and
 * stopped short at 0.85 of its delivery (provisional), with no contact
 * declared. The `stagePalmStrike` row of `HumanStageFight` reads it, so the row
 * and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE: IAutoMovieMotionHumanStageFight.IStagePunchPreset =
  { technique: "palmHeel", hand: "rear", feint: 0.85 };
