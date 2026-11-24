import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `patOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A pat: the flat palm bounces on the target, up and
 * down.
 */
export const HUMAN_GESTURE_PHRASE_PAT_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0, up: 0.05, forward: 0 },
    count: 3,
  };
