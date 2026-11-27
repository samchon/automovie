import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/*
 * The stage headbutt preset: the forehead driven at the target and stopped
 * short at 0.85 of its delivery (provisional), with no contact declared. The
 * `stageHeadbutt` row of `HumanStageFight` reads it, so the row and the preset
 * share one value.
 */
export const HUMAN_STAGE_FIGHT_STAGE_HEADBUTT: IAutoMovieMotionHumanStageFight.IStageHeadbuttPreset =
  { technique: "headbutt", feint: 0.85 };
