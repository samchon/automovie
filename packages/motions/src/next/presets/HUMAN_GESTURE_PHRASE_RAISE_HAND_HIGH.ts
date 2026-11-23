import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `raiseHandHigh` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. A raised hand: the open hand visits a place above the shoulder, palm forward, and holds it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_RAISE_HAND_HIGH`; the `raiseHandHigh` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.1, up: 0.9, forward: 0.1 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  };
