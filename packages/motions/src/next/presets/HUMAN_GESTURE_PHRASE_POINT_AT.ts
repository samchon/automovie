import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `pointAt` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. A point: the forefinger's tip visits a place on the
 * target's line, the hand pointing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_POINT_AT`; the `pointAt` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_POINT_AT: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "indexTip",
    shape: "point",
    hold: "beat",
  };
