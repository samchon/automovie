import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The spinningHookKick preset: a spinning hook kick with the rear leg. Spread
 * into `footStrike`'s parameters beside the rest that the composition gives;
 * each value means what the law's member of the same name does. The
 * `spinningHookKick` row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_SPINNING_HOOK_KICK: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "hook",
    leg: "rear",
    spin: true,
  };
