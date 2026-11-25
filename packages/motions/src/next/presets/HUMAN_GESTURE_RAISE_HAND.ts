import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureRaiseHand` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `raiseHand`: one
 * raise of 0.5 s, plus the preparation and retraction; fits asking to speak,
 * volunteering, calling for attention ({@link gestureStrokeTables.RHYTHM},
 * `count` repeats the stroke).
 */
export const HUMAN_GESTURE_RAISE_HAND: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "raiseHand" };
