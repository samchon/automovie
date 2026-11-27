import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureWave` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `wave`: three swings of 0.4 s,
 * a stroke of 1.2 s, plus the preparation and retraction; fits a greeting, a
 * farewell, hailing someone (gestureStrokeTables.RHYTHM, `count` repeats
 * the stroke).
 */
export const HUMAN_GESTURE_WAVE: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "wave",
  };
