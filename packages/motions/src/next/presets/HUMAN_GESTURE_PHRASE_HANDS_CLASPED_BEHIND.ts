import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handsClaspedBehind` row of `HumanUpperRows` fixes on
 * `armPhrase`, spread into its parameters. Hands clasped behind: both palms
 * meet behind the lower back and stay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HANDS_CLASPED_BEHIND`; the `handsClaspedBehind` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HANDS_CLASPED_BEHIND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetFacingHoldPreset =
  {
    phrase: "visit",
    hand: "both",
    target: { kind: "self", region: "lowerBack" },
    offset: { out: 0, up: -0.05, forward: -0.08 },
    facing: { fingers: "down", palm: "in" },
    hold: "long",
  };
