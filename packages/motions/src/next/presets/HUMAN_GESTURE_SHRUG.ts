import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureShrug` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `shrug`: one shrug of 0.7 s,
 * both shoulders, plus the preparation and retraction; fits indifference, "I do
 * not know" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_SHRUG: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "shrug",
  };
