import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `countFive` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. Counting five on the fingers: the open hand.
 */
export const HUMAN_GESTURE_EMBLEM_COUNT_FIVE: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "count5",
  };
