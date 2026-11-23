import type { IAutoMovieMotionHumanFloor } from "@automovie/interface";

/**
 * The sitOnFloor preset of `lieDown`: Sitting down on the floor, the legs long, and staying three seconds (provisional). Spread into `lieDown`'s parameters; the `sitOnFloor` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The lieDown law's own members as one `ILieDownPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFloor.SIT_ON_FLOOR`; the `sitOnFloor` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FLOOR_SIT_ON_FLOOR: IAutoMovieMotionHumanFloor.ILieDownPreset =
  {
    kind: "sitLong",
    hold: 3,
  };
