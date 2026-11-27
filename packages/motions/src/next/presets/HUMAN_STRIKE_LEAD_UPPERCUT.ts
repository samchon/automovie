import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The leadUppercut preset: an uppercut with the lead hand. Spread into
 * `punch`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `leadUppercut` row of
 * `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_LEAD_UPPERCUT: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "uppercut",
    hand: "lead",
  };
