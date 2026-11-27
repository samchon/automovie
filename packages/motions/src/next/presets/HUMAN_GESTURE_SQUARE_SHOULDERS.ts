import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureSquareShoulders` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `squareShoulders`: a
 * held pose of 0.8 s, plus the preparation and retraction; fits resolve,
 * readiness (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_SQUARE_SHOULDERS: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "squareShoulders",
  };
