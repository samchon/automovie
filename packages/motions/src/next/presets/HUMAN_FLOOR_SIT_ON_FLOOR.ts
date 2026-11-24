import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The sitOnFloor preset of `lieDown`: Sitting down on the floor, the legs long,
 * and staying three seconds (provisional). Spread into `lieDown`'s parameters;
 * the `sitOnFloor` row reads it.
 */
export const HUMAN_FLOOR_SIT_ON_FLOOR: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    kind: "sitLong",
    hold: 3,
  };
