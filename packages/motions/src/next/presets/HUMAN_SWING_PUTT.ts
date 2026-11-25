import type { IAutoMovieMotionHumanSwing } from "@automovie/interface";

/**
 * A golf putt or chip: both hands, a level stroke along the ground line. Spread
 * into the cut's parameters; the row adds the implement's measured speed.
 */
export const HUMAN_SWING_PUTT: IAutoMovieMotionHumanSwing.IGripPreset = {
  from: "forehand",
  hands: 2,
};
