import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `chinOnFist` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Chin in hand: the fist visits the chin and stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_CHIN_ON_FIST`; the `chinOnFist` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_CHIN_ON_FIST: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "chin" },
    surface: "fist",
    shape: "fist",
    hold: "long",
  };
