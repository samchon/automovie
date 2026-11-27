import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The pushKick preset: a push kick with the lead foot. Spread into `kick`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `pushKick` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_PUSH_KICK: IAutoMovieMotionHumanStrike.IKickPreset = {
  technique: "push",
  leg: "lead",
};
