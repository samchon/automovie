import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `stirStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Stirring: the fist that holds the spoon circles
 * out and in over the pot.
 */
export const HUMAN_GESTURE_PHRASE_STIR_STROKES: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0.05, up: 0, forward: 0.05 },
    count: 4,
  };
