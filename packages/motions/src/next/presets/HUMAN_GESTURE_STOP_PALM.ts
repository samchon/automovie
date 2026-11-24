import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureStopPalm` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `stopPalm`: one push
 * of 0.35 s, plus the preparation and retraction; fits halting someone,
 * refusing, "wait" ({@link gestureStrokeTables.RHYTHM}, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_STOP_PALM: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "stopPalm",
  };
