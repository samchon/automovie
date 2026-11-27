import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The rearChainPunch preset: a wing chun chain punch with the rear hand. Spread
 * into `punch`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `rearChainPunch`
 * row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_REAR_CHAIN_PUNCH: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "verticalFist",
    hand: "rear",
  };
