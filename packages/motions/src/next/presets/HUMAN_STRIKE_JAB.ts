import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The jab preset: a straight punch with the lead hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `jab` row of `HumanStrike` fixes
 * these values.
 */
export const HUMAN_STRIKE_JAB: IAutoMovieMotionHumanStrike.IPunchPreset = {
  technique: "straight",
  hand: "lead",
};
