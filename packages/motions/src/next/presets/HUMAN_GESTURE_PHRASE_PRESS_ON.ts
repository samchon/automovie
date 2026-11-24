import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `pressOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A press: the palm visits the target and holds.
 */
export const HUMAN_GESTURE_PHRASE_PRESS_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "palm",
    shape: "flat",
    hold: "long",
  };
