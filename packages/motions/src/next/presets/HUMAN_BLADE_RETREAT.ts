import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/*
 * The retreat preset: one step back with the stance kept, the footwork of a
 * retreat. The `retreat` row of `HumanBlade` reads it, so the row and the
 * preset share one value.
 */
export const HUMAN_BLADE_RETREAT: IAutoMovieMotionHumanBlade.IFootworkPreset = {
  direction: "back",
  steps: 1,
};
