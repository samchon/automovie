import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `phoneToEar` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A phone to the ear: the hand that holds it visits
 * the ear and stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_PHONE_TO_EAR`; the `phoneToEar` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_PHONE_TO_EAR: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "earRight" },
    mirror: true,
    surface: "grip",
    shape: "fist",
    hold: "long",
  };
