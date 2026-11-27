import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `tapOn` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A tap: the fingertips visit the target with no hold.
 */
export const HUMAN_GESTURE_PHRASE_TAP_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "indexTip",
    shape: "flat",
    hold: "none",
  };
