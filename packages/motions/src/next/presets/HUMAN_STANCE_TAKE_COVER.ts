import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The takeCover preset of `crouch`: Crouching and holding two seconds
 * (provisional). Spread into `crouch`'s parameters; the `takeCover` row reads
 * it.
 */
export const HUMAN_STANCE_TAKE_COVER: IAutoMovieMotionHumanStance.ICrouchPreset =
  {
    hold: 2,
  };
