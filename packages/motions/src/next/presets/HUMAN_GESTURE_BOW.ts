import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureBow` row of `HumanGestureRows` fixes on `gesture`, spread into its parameters. `gesture` of kind `bow`: the trunk goes down at about 50 degrees a second, is held 0.95 s at the deepest (Kawabata et al. 2009) and comes up at about 43 degrees a second; 30 degrees when `depth` is absent, plus the preparation and retraction; fits a greeting of respect, thanks, an apology ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.BOW`; the `gestureBow` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_BOW: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "bow",
  };
