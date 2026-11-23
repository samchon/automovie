import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `cheerHands` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A cheer: both open hands visit places above and
 * beside the head, palms forward, for a beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_CHEER_HANDS`; the `cheerHands` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_CHEER_HANDS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetFacingHoldPreset =
  {
    phrase: "visit",
    hand: "both",
    target: { kind: "self", region: "crown" },
    offset: { out: 0.3, up: 0.25, forward: 0.05 },
    facing: { fingers: "up", palm: "forward" },
    hold: "beat",
  };
