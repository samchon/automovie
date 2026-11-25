import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureBow` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `bow`: the trunk goes down at
 * about 50 degrees a second, is held 0.95 s at the deepest (Kawabata et al.
 * 2009) and comes up at about 43 degrees a second; 30 degrees when `depth` is
 * absent, plus the preparation and retraction; fits a greeting of respect,
 * thanks, an apology ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_BOW: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "bow",
  };
