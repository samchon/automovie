import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureRubHands` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `rubHands`: three
 * rubs of 0.35 s, a stroke of 1.05 s, both hands, plus the preparation and
 * retraction; fits anticipation, cold, scheming
 * ({@link gestureStrokeTables.RHYTHM}, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_RUB_HANDS: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "rubHands",
  };
