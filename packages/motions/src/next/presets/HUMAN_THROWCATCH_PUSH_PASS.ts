import type { IAutoMovieMotionHumanThrowCatch } from "@automovie/interface";

/**
 * A one-hand push pass, a free throw or a shot put (the two-hand chest and
 * bounce passes are `ballSport` kinds `chestPass` and `bouncePass`): the toss
 * style, release 50 degrees after a 0.35 s windup. Spread into `throwObject`'s
 * parameters with the target.
 */
export const HUMAN_THROWCATCH_PUSH_PASS: IAutoMovieMotionHumanThrowCatch.IStylePreset =
  { style: "toss" };
