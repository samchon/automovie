import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `rubOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A rub: the palm oscillates across the target.
 */
export const HUMAN_GESTURE_PHRASE_RUB_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.05, up: 0, forward: 0 },
    count: 3,
  };
