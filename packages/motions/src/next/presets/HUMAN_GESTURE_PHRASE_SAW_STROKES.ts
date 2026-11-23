import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `sawStrokes` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Sawing: the fist that holds the saw draws forward
 * and back over the target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseSurfaceShapeSwingCountPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_SAW_STROKES`; the `sawStrokes` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_SAW_STROKES: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0, forward: 0.2 },
    count: 4,
  };
