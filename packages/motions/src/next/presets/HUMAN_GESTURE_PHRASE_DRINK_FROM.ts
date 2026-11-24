import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `drinkFrom` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Drinking: the hand that holds a vessel brings its
 * lip to the mouth and holds it there; the vessel is named as `held`.
 */
export const HUMAN_GESTURE_PHRASE_DRINK_FROM: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapePointHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    point: "lip",
    hold: "long",
  };
