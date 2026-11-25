import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureSlump` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `slump`: a held pose of 0.8 s,
 * plus the preparation and retraction; fits defeat, exhaustion, dejection
 * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_SLUMP: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "slump",
  };
