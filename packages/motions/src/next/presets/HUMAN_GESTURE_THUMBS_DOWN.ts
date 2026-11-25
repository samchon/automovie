import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureThumbsDown` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `thumbsDown`: a held
 * sign of 0.8 s, plus the preparation and retraction; fits disapproval,
 * rejection ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_THUMBS_DOWN: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "thumbsDown" };
