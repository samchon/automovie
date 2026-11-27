import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The spinningElbow preset: a spinning elbow with the rear arm. Spread into
 * `closeStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `spinningElbow`
 * row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_SPINNING_ELBOW: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "spinningElbow",
    arm: "rear",
  };
