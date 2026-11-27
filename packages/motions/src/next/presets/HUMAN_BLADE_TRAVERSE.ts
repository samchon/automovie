import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/*
 * The traverse preset: one step to the left with the stance kept, the footwork
 * of a traverse. The `traverse` row of `HumanBlade` reads it, so the row and
 * the preset share one value.
 */
export const HUMAN_BLADE_TRAVERSE: IAutoMovieMotionHumanBlade.IFootworkPreset =
  { direction: "left", steps: 1 };
