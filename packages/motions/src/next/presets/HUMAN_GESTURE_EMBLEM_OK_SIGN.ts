import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `okSign` row of `HumanEmblem` fixes on `gesture`, spread into
 * its parameters. The OK sign: the forefinger and thumb in a ring, held out
 * (first pass, provisional attitude).
 */
export const HUMAN_GESTURE_EMBLEM_OK_SIGN: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "ok",
  };
