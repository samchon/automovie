import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The sitCrossLegged preset of `lieDown`: Sitting down on the floor cross-legged and staying three seconds (provisional). Spread into `lieDown`'s parameters; the `sitCrossLegged` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The lieDown law's own members as one `ILieDownPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFloor.SIT_CROSS_LEGGED`; the `sitCrossLegged` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FLOOR_SIT_CROSS_LEGGED: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    kind: "sitCrossed",
    hold: 3,
  };
