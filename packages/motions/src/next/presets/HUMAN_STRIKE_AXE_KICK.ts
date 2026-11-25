import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The axeKick preset: an axe kick with the rear leg. Spread into `footStrike`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `axeKick` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_AXE_KICK: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "axe",
    leg: "rear",
  };
