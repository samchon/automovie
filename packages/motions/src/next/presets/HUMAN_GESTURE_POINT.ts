import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gesturePoint` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `point`: one point of 0.5 s,
 * plus the preparation and retraction; fits showing a thing or a direction to
 * someone (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_POINT: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "point",
  };
