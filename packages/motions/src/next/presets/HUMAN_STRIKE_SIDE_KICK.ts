import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The sideKick preset: a side kick with the lead leg. Spread into
 * `footStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `sideKick` row
 * of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_SIDE_KICK: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "side",
    leg: "lead",
  };
