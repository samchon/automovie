import type { IAutoMovieMotionHumanSeat } from "@automovie/interface";

/**
 * The kneelSit preset of `kneel`: Sitting back on the heels from both knees and
 * staying three seconds (provisional). Spread into `kneel`'s parameters; the
 * `kneelSit` row reads it.
 */
export const HUMAN_SEAT_KNEEL_SIT: IAutoMovieMotionHumanSeat.IKneelPreset = {
  kind: "sitBack",
  hold: 3,
  rise: false,
};
