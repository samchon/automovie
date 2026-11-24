import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The spinningBackfist preset: a spinning backfist with the rear arm. Spread
 * into `closeStrike`'s parameters beside the rest that the composition gives;
 * each value means what the law's member of the same name does. The
 * `spinningBackfist` row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_SPINNING_BACKFIST: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "spinningBackfist",
    arm: "rear",
  };
