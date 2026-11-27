import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The cross preset: a straight punch with the rear hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `cross` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_CROSS: IAutoMovieMotionHumanStrike.IPunchPreset = {
  technique: "straight",
  hand: "rear",
};
