import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureNod` row of `HumanGestureRows` fixes on `gesture`, spread into its parameters. `gesture` of kind `nod`: two nods of 0.5 s, a stroke of 1.0 s, plus the preparation and retraction; fits yes, agreement, acknowledgement ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.NOD`; the `gestureNod` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_NOD: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "nod",
  };
