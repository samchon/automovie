import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The leadKnee preset: a knee strike with the lead leg. Spread into `knee`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `leadKnee` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_LEAD_KNEE: IAutoMovieMotionHumanStrike.IKneePreset = {
  leg: "lead",
};
