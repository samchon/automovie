import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureBeckon` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `beckon`: two curls of 0.6 s, a
 * stroke of 1.2 s, plus the preparation and retraction; fits calling someone
 * over ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_BECKON: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "beckon",
  };
