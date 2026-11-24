import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `chinOnFist` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Chin in hand: the fist visits the chin and
 * stays.
 */
export const HUMAN_GESTURE_PHRASE_CHIN_ON_FIST: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "chin" },
    surface: "fist",
    shape: "fist",
    hold: "long",
  };
