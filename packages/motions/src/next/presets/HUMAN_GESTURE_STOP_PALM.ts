import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureStopPalm` row of `HumanGestureRows` fixes on `gesture`, spread into its parameters. `gesture` of kind `stopPalm`: one push of 0.35 s, plus the preparation and retraction; fits halting someone, refusing, "wait" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.STOP_PALM`; the `gestureStopPalm` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_STOP_PALM: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "stopPalm",
  };
