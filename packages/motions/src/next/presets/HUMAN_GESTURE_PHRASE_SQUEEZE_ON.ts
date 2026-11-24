import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `squeezeOn` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A squeeze: the hand closes on the target and
 * holds.
 */
export const HUMAN_GESTURE_PHRASE_SQUEEZE_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "grip",
    shape: "fist",
    hold: "long",
  };
