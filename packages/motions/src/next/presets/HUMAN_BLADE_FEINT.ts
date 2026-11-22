import type { IAutoMovieMotionHumanBlade } from "@automovie/interface";

/**
 * The feint preset: a cut carried to half its delivery (provisional) and withdrawn. The `feint` row of `HumanBlade` reads it, so the row and the preset share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanBlade.IFeintPreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanBlade.FEINT`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_BLADE_FEINT: IAutoMovieMotionHumanBlade.IFeintPreset = {
  feint: 0.5,
};
