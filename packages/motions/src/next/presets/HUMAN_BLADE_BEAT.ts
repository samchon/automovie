import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/*
 * The beat preset: a parry that is not held: the blade strikes the opponent's
 * blade aside and does not stay on it. The `beat` row of `HumanBlade` reads it,
 * so the row and the preset share one value.
 */
export const HUMAN_BLADE_BEAT: IAutoMovieMotionHumanBlade.IHoldPreset = {
  hold: 0,
};
