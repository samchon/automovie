import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `gesturePalmsUp` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `palmsUp`: one opening of 0.6
 * s, both hands, plus the preparation and retraction; fits "I do not know", an
 * appeal, offering an explanation (gestureStrokeTables.RHYTHM, `count`
 * repeats the stroke).
 */
export const HUMAN_GESTURE_PALMS_UP: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "palmsUp",
  };
