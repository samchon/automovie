import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The roundKick preset: a round kick with the rear leg. Spread into `kick`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `roundKick` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_ROUND_KICK: IAutoMovieMotionHumanStrike.IKickPreset =
  {
    technique: "round",
    leg: "rear",
  };
