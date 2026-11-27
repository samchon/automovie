import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureClap` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `clap`: four claps at 4 a
 * second (Neda et al. 2000), a stroke of 1.0 s, both hands, plus the
 * preparation and retraction; fits applause, a cheer, getting attention
 * (gestureStrokeTables.RHYTHM, `count` repeats the stroke).
 */
export const HUMAN_GESTURE_CLAP: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "clap",
  };
