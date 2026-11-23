import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `hatOnHead` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Putting on a hat: the hand that holds it visits
 * the crown and stays a beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HAT_ON_HEAD`; the `hatOnHead` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HAT_ON_HEAD: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  };
