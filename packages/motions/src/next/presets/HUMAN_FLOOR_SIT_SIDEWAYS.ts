import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/*
 * The sitSideways preset of `lieDown`: Sitting down on the floor with both legs
 * folded to one side and staying three seconds (provisional). Spread into
 * `lieDown`'s parameters; the `sitSideways` row reads it.
 */
export const HUMAN_FLOOR_SIT_SIDEWAYS: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    kind: "sitSide",
    hold: 3,
  };
