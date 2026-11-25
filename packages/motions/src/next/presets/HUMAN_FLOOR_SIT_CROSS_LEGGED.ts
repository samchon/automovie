import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The sitCrossLegged preset of `lieDown`: Sitting down on the floor
 * cross-legged and staying three seconds (provisional). Spread into `lieDown`'s
 * parameters; the `sitCrossLegged` row reads it.
 */
export const HUMAN_FLOOR_SIT_CROSS_LEGGED: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    kind: "sitCrossed",
    hold: 3,
  };
