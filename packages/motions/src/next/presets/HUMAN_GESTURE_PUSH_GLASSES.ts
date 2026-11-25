import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gesturePushGlasses` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `pushGlasses`: one
 * push of 0.3 s, plus the preparation and retraction; fits a nervous or
 * studious beat ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_PUSH_GLASSES: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "pushGlasses" };
