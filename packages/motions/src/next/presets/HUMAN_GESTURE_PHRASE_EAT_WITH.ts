import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `eatWith` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Eating: the hand that holds a utensil brings the point it names (a fork's `face`) to the mouth for a beat; the utensil is named as `held`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_EAT_WITH`; the `eatWith` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_EAT_WITH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  };
