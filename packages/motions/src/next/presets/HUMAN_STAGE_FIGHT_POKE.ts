import type { IAutoMovieMotionHumanStageFight } from "@automovie/interface";

/**
 * The poke preset: a tap of the fingertips. The `poke` row of `HumanStageFight`
 * reads it, so the row and the preset share one value.
 */
export const HUMAN_STAGE_FIGHT_POKE: IAutoMovieMotionHumanStageFight.IPokePreset =
  { effector: "fingertips", kind: "tap" };
