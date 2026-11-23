import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `crossedFingers` row of `HumanEmblem` fixes on `gesture`,
 * spread into its parameters. Crossed fingers, held out (first pass,
 * provisional attitude).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindShapePreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.EMBLEM_CROSSED_FINGERS`; the `crossedFingers` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "crossed",
  };
