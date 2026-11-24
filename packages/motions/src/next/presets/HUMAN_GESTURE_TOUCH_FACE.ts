import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureTouchFace` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `touchFace`: a held
 * touch of 0.8 s, plus the preparation and retraction; fits thinking, doubt,
 * embarrassment ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_TOUCH_FACE: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "touchFace" };
