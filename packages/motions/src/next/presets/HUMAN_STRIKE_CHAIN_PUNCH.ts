import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The chainPunch preset: a wing chun chain punch with the lead hand, a vertical
 * fist along the centreline. Spread into `punch`'s parameters beside the rest
 * that the composition gives; each value means what the law's member of the
 * same name does. The `chainPunch` row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_CHAIN_PUNCH: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "verticalFist",
    hand: "lead",
  };
