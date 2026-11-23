import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `wipeMouthAcross` row of `HumanUpperRows` fixes on
 * `armPhrase`, spread into its parameters. Wiping the mouth: the back of the
 * hand draws across the lips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeFromPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_WIPE_MOUTH_ACROSS`; the `wipeMouthAcross` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeFromPreset =
  {
    phrase: "stroke",
    target: { kind: "self", region: "mouth" },
    surface: "handBack",
    shape: "relaxed",
    from: { out: 0.08, up: 0, forward: 0 },
  };
