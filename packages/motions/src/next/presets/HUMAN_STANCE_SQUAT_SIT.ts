import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The squatSit preset of `crouch`: Squatting fully, the heels up, and holding
 * three seconds (provisional). Spread into `crouch`'s parameters; the
 * `squatSit` row reads it.
 */
export const HUMAN_STANCE_SQUAT_SIT: IAutoMovieMotionHumanStance.ICrouchPreset =
  {
    depth: "full",
    heels: "up",
    hold: 3,
  };
