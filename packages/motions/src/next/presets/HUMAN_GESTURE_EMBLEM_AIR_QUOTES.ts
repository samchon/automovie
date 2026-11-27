import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `airQuotes` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. Air quotes: both hands raised with two fingers hooked
 * (first pass on the raised hands of a cheer; the fingers do not flex twice
 * yet).
 */
export const HUMAN_GESTURE_EMBLEM_AIR_QUOTES: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "cheer",
    shape: "quotes",
  };
