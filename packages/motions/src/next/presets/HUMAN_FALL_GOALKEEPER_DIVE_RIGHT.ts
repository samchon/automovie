import type { IAutoMovieMotionHumanFall } from "@automovie/interface";

/**
 * The goalkeeper's dive to the right: the body dives to its own right side. Spread into
 * the dive law's parameters with the kind of fall; the `goalkeeperDiveRight` row of `HumanFloorFall` fixes this value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the side the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The dive's own side as one `IDivePreset`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanFall.GOALKEEPER_DIVE_RIGHT`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_FALL_GOALKEEPER_DIVE_RIGHT: IAutoMovieMotionHumanFall.IDivePreset =
  {
    side: "right",
  };
