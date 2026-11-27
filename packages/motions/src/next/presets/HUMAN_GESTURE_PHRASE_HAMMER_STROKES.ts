import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `hammerStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Hammering: the fist that holds the hammer strikes
 * down and back on the target, up and down.
 */
export const HUMAN_GESTURE_PHRASE_HAMMER_STROKES: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0.15, forward: 0 },
    count: 4,
  };
