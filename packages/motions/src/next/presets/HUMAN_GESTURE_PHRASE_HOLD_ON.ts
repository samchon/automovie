import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `holdOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A hold: the relaxed palm rests on the target and stays.
 */
export const HUMAN_GESTURE_PHRASE_HOLD_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  };
