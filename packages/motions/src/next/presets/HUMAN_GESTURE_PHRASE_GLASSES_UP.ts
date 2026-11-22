import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `glassesUp` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Pushing up one's glasses: the forefinger's tip visits the bridge of the nose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_GLASSES_UP`; the `glassesUp` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_GLASSES_UP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "noseBridge" },
    surface: "indexTip",
    shape: "point",
    hold: "none",
  };
