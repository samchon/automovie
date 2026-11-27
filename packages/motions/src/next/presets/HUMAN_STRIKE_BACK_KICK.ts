import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The backKick preset: a back kick with the rear leg. Spread into
 * `footStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `backKick` row
 * of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_BACK_KICK: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "back",
    leg: "rear",
  };
