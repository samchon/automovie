import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The backfist preset: a backfist with the lead hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `backfist` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_BACKFIST: IAutoMovieMotionHumanStrike.IPunchPreset = {
  technique: "backfist",
  hand: "lead",
};
