import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The rearHook preset: a hook with the rear hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `rearHook` row of `HumanStrike`
 * fixes these values.
 */
export const HUMAN_STRIKE_REAR_HOOK: IAutoMovieMotionHumanStrike.IPunchPreset =
  {
    technique: "hook",
    hand: "rear",
  };
