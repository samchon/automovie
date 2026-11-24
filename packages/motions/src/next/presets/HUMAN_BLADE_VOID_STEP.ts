import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The void step preset: one step back with the stance kept, the step that
 * leaves the line of an attack. The `voidStep` row of `HumanBlade` reads it, so
 * the row and the preset share one value.
 */
export const HUMAN_BLADE_VOID_STEP: IAutoMovieMotionHumanBlade.IFootworkPreset =
  { direction: "back", steps: 1 };
