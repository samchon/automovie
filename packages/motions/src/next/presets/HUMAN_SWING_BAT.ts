import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A baseball swing: both hands, level from the bat hand's side. Spread into the
 * cut's parameters; the row adds the implement's measured speed.
 */
export const HUMAN_SWING_BAT: IAutoMovieMotionHumanSwing.IGripPreset = {
  from: "forehand",
  hands: 2,
};
