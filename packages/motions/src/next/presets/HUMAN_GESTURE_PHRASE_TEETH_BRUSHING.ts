import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `teethBrushing` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Brushing the teeth: the hand that holds the brush
 * oscillates before the mouth.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_TEETH_BRUSHING`; the `teethBrushing` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_TEETH_BRUSHING: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    swing: { out: 0.04, up: 0, forward: 0 },
    count: 6,
  };
