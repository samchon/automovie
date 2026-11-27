import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The horizontalElbow preset: a horizontal elbow with the rear arm. Spread into
 * `closeStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The
 * `horizontalElbow` row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_HORIZONTAL_ELBOW: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "horizontalElbow",
    arm: "rear",
  };
