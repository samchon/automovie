import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The risingElbow preset: a rising elbow with the rear arm. Spread into
 * `closeStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `risingElbow`
 * row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_RISING_ELBOW: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "risingElbow",
    arm: "rear",
  };
