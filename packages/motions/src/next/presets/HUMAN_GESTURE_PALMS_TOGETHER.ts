import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gesturePalmsTogether` row of `HumanGestureRows` fixes on `gesture`, spread into its parameters. `gesture` of kind `palmsTogether`: one close of 0.8 s, both hands, plus the preparation and retraction; fits a plea, a prayer, thanks ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PALMS_TOGETHER`; the `gesturePalmsTogether` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PALMS_TOGETHER: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "palmsTogether",
  };
