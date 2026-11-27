import type { IAutoMovieMotionHumanSeat } from "@automovie/interface";

/*
 * The takeAKnee preset of `kneel`: Kneeling on one knee and staying three
 * seconds without rising (provisional). Spread into `kneel`'s parameters; the
 * `takeAKnee` row reads it.
 */
export const HUMAN_SEAT_TAKE_A_KNEE: IAutoMovieMotionHumanSeat.IKneelPreset = {
  hold: 3,
  rise: false,
};
