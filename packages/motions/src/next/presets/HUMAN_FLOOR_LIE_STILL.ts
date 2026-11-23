import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The lieStill preset of `lieDown`: Lying down and staying three seconds
 * (provisional), as to sleep or to play dead. Spread into `lieDown`'s
 * parameters; the `lieStill` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The lieDown law's own members as one `ILieDownPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFloor.LIE_STILL`; the `lieStill` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FLOOR_LIE_STILL: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    hold: 3,
  };
