import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gestureCheer` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `cheer`: two raises of 0.5 s, a
 * stroke of 1.0 s, both hands, plus the preparation and retraction; fits
 * celebrating, a win, acclaim ({@link gestureStrokeTables.RHYTHM}, `count`
 * repeats the stroke).
 */
export const HUMAN_GESTURE_CHEER: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "cheer",
  };
