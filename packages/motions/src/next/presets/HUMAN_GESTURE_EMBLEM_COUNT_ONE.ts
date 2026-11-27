import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `countOne` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. Counting one on the fingers, from the forefinger on (one
 * convention; cultures differ).
 */
export const HUMAN_GESTURE_EMBLEM_COUNT_ONE: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "count1",
  };
