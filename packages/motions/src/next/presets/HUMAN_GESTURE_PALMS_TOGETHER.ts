import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gesturePalmsTogether` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `palmsTogether`: one
 * close of 0.8 s, both hands, plus the preparation and retraction; fits a plea,
 * a prayer, thanks ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_PALMS_TOGETHER: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "palmsTogether",
  };
