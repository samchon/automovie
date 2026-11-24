import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The lieStill preset of `lieDown`: Lying down and staying three seconds
 * (provisional), as to sleep or to play dead. Spread into `lieDown`'s
 * parameters; the `lieStill` row reads it.
 */
export const HUMAN_FLOOR_LIE_STILL: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    hold: 3,
  };
