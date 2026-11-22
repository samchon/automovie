import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `fingerSnap` row of `HumanEmblem` fixes on `gesture`, spread into its parameters. The hand set for a finger snap: the middle fingertip on the thumb's, held out (first pass: the snap's release is not moved).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindShapePreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.EMBLEM_FINGER_SNAP`; the `fingerSnap` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_EMBLEM_FINGER_SNAP: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "snap",
  };
