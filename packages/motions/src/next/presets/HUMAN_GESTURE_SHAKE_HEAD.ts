import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureShakeHead` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `shakeHead`: three
 * turns of 0.45 s, a stroke of 1.35 s, plus the preparation and retraction;
 * fits no, disagreement, disbelief ({@link gestureStrokeTables.RHYTHM}, `count`
 * repeats the stroke).
 */
export const HUMAN_GESTURE_SHAKE_HEAD: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "shakeHead" };
