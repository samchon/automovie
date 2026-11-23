import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handBehindHead` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A hand behind the head: the palm visits the back
 * of the head and stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HAND_BEHIND_HEAD`; the `handBehindHead` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "headBack" },
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  };
