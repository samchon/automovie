import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureScratchHead` row of `HumanGestureRows` fixes on
 * `gesture`, spread into its parameters. `gesture` of kind `scratchHead`: four
 * scratches of 0.25 s, a stroke of 1.0 s, plus the preparation and retraction;
 * fits puzzlement, confusion (gestureStrokeTables.RHYTHM, `count`
 * repeats the stroke).
 */
export const HUMAN_GESTURE_SCRATCH_HEAD: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  { kind: "scratchHead" };
