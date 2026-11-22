import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handOnHip` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Hand on the hip: the palm visits the near hip and stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HAND_ON_HIP`; the `handOnHip` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HAND_ON_HIP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    surface: "palm",
    shape: "flat",
    hold: "long",
  };
