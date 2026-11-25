import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `victorySign` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. The V sign: forefinger and middle finger spread, held
 * out (first pass, provisional attitude).
 */
export const HUMAN_GESTURE_EMBLEM_VICTORY_SIGN: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "victory",
  };
