import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureChinLift` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `chinLift`: a held
 * pose of 0.8 s, plus the preparation and retraction; fits pride, defiance
 * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_CHIN_LIFT: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "chinLift",
  };
