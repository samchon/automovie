import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The advance preset: one step forward with the stance kept, the footwork of an
 * advance. The `advance` row of `HumanBlade` reads it, so the row and the
 * preset share one value.
 */
export const HUMAN_BLADE_ADVANCE: IAutoMovieMotionHumanBlade.IFootworkPreset = {
  direction: "forward",
  steps: 1,
};
