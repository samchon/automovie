import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `squeezeOn` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. A squeeze: the hand closes on the target and holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_SQUEEZE_ON`; the `squeezeOn` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_SQUEEZE_ON: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    surface: "grip",
    shape: "fist",
    hold: "long",
  };
