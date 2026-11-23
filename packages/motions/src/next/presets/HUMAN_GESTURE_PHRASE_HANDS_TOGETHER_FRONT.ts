import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handsTogetherFront` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Hands clasped in front: both palms meet before the abdomen and stay.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HANDS_TOGETHER_FRONT`; the `handsTogetherFront` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HANDS_TOGETHER_FRONT: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetFacingHoldPreset =
  {
    phrase: "visit",
    hand: "both",
    target: { kind: "self", region: "abdomen" },
    offset: { out: 0, up: 0, forward: 0.15 },
    facing: { fingers: "forward", palm: "in" },
    hold: "long",
  };
