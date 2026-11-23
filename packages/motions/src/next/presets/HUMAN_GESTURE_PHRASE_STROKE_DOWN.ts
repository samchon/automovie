import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `strokeDown` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. A stroke: the palm draws down along the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseSurfaceShapeFromPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_STROKE_DOWN`; the `strokeDown` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_STROKE_DOWN: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeFromPreset =
  {
    phrase: "stroke",
    surface: "palm",
    shape: "flat",
    from: { out: 0, up: 0.1, forward: 0 },
  };
