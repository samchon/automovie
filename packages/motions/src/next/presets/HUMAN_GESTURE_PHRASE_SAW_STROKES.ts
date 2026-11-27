import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `sawStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Sawing: the fist that holds the saw draws forward
 * and back over the target.
 */
export const HUMAN_GESTURE_PHRASE_SAW_STROKES: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0, forward: 0.2 },
    count: 4,
  };
