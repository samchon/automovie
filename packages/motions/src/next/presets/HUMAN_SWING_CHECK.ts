import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A checked swing: the bat started and held back at half its path. Spread into
 * the cut's parameters; the row adds the implement's measured speed.
 */
export const HUMAN_SWING_CHECK: IAutoMovieMotionHumanSwing.ICheckPreset = {
  from: "forehand",
  hands: 2,
  feint: 0.5,
};
