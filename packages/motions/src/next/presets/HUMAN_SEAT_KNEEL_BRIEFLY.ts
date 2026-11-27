import type { IAutoMovieMotionHumanSeat } from "@automovie/interface";

/*
 * The kneelBriefly preset of `kneel`: Kneeling, staying one second and rising
 * again (provisional). Spread into `kneel`'s parameters; the `kneelBriefly` row
 * reads it.
 */
export const HUMAN_SEAT_KNEEL_BRIEFLY: IAutoMovieMotionHumanSeat.IKneelPreset =
  {
    hold: 1,
    rise: true,
  };
