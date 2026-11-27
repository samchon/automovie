import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `pointAt` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A point: the forefinger's tip visits a place on the
 * target's line, the hand pointing.
 */
export const HUMAN_GESTURE_PHRASE_POINT_AT: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "indexTip",
    shape: "point",
    hold: "beat",
  };
