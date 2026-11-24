import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `scratchOn` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A scratch: the fingertips oscillate in short
 * strokes on the target.
 */
export const HUMAN_GESTURE_PHRASE_SCRATCH_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0.02, forward: 0 },
    count: 5,
  };
