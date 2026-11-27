import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The palmHeel preset: a palm-heel strike with the rear hand. Spread into
 * `punch`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `palmHeel` row of
 * `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_PALM_HEEL: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "palmHeel",
    hand: "rear",
  };
