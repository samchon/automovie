import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The hookKick preset: a hook kick with the lead leg. Spread into
 * `footStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `hookKick` row
 * of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_HOOK_KICK: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "hook",
    leg: "lead",
  };
