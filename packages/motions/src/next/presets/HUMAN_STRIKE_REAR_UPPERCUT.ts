import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The rearUppercut preset: an uppercut with the rear hand. Spread into
 * `punch`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `rearUppercut` row of
 * `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_REAR_UPPERCUT: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "uppercut",
    hand: "rear",
  };
