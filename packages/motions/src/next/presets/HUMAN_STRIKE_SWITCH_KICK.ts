import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The switchKick preset: a round kick with the lead leg. Spread into `kick`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `switchKick` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_SWITCH_KICK: IAutoMovieMotionHumanStrike.IKickPreset =
  {
    technique: "round",
    leg: "lead",
  };
