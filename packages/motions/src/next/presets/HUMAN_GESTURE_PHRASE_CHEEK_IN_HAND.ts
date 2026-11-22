import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `cheekInHand` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. A hand to the cheek: the palm visits the cheek and stays a beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_CHEEK_IN_HAND`; the `cheekInHand` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "cheekRight" },
    mirror: true,
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  };
