import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The hammerfist preset: a hammerfist with the rear hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `hammerfist` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_HAMMERFIST: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "hammerfist",
    hand: "rear",
  };
