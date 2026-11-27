import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gestureNod` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `nod`: two nods of 0.5 s, a
 * stroke of 1.0 s, plus the preparation and retraction; fits yes, agreement,
 * acknowledgement (gestureStrokeTables.RHYTHM, `count` repeats the
 * stroke).
 */
export const HUMAN_GESTURE_NOD: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "nod",
  };
