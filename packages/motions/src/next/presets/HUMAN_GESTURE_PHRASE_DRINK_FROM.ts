import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `drinkFrom` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Drinking: the hand that holds a vessel brings its lip to the mouth and holds it there; the vessel is named as `held`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapePointHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_DRINK_FROM`; the `drinkFrom` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
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
