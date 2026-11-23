import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The advance preset: one step forward with the stance kept, the footwork of an advance. The `advance` row of `HumanBlade` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanBlade.IFootworkPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBlade.ADVANCE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BLADE_ADVANCE: IAutoMovieMotionHumanBlade.IFootworkPreset = {
  direction: "forward",
  steps: 1,
};
