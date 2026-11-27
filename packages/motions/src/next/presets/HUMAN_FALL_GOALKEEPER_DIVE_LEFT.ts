import type { IAutoMovieMotionHumanFall } from "@automovie/interface";

/*
 * The goalkeeper's dive to the left: the body dives to its own left side.
 * Spread into the dive law's parameters with the kind of fall; the
 * `goalkeeperDiveLeft` row of `HumanFloorFall` fixes this value.
 */
export const HUMAN_FALL_GOALKEEPER_DIVE_LEFT: IAutoMovieMotionHumanFall.IDivePreset =
  {
    side: "left",
  };
