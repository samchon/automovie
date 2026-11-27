import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/*
 * The bind preset: a parry held for one second (provisional): the blade stays
 * on the opponent's blade. The `bind` row of `HumanBlade` reads it, so the row
 * and the preset share one value.
 */
export const HUMAN_BLADE_BIND: IAutoMovieMotionHumanBlade.IHoldPreset = {
  hold: 1,
};
