import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `eatWith` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. Eating: the hand that holds a utensil brings the point
 * it names (a fork's `face`) to the mouth for a beat; the utensil is named as
 * `held`.
 */
export const HUMAN_GESTURE_PHRASE_EAT_WITH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  };
