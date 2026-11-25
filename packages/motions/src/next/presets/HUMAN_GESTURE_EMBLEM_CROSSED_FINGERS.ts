import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `crossedFingers` row of `HumanEmblem` fixes on `gesture`,
 * spread into its parameters. Crossed fingers, held out (first pass,
 * provisional attitude).
 */
export const HUMAN_GESTURE_EMBLEM_CROSSED_FINGERS: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "crossed",
  };
