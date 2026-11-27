import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The rearKnee preset: a knee strike with the rear leg. Spread into `knee`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `rearKnee` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_REAR_KNEE: IAutoMovieMotionHumanStrike.IKneePreset = {
  leg: "rear",
};
