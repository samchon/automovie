import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handInPocket` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A hand in the pocket: the fingertips visit the
 * front pocket and stay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HAND_IN_POCKET`; the `handInPocket` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HAND_IN_POCKET: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "pocketFrontRight" },
    mirror: true,
    surface: "indexTip",
    shape: "relaxed",
    hold: "long",
  };
