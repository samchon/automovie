import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The leadHook preset: a hook with the lead hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `leadHook` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_LEAD_HOOK: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "hook",
    hand: "lead",
  };
