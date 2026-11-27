import type { IAutoMovieMotionHumanFall } from "@automovie/interface";

/*
 * The goalkeeper's dive to the right: the body dives to its own right side.
 * Spread into the dive law's parameters with the kind of fall; the
 * `goalkeeperDiveRight` row of `HumanFloorFall` fixes this value.
 */
export const HUMAN_FALL_GOALKEEPER_DIVE_RIGHT: IAutoMovieMotionHumanFall.IDivePreset =
  {
    side: "right",
  };
