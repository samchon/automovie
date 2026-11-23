import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `rubPalms` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Rubbing the hands: both palms together ahead of the chest, sliding up and down.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetSwingCountFacingPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_RUB_PALMS`; the `rubPalms` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_RUB_PALMS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    hand: "both",
    target: { kind: "self", region: "sternum" },
    offset: { out: 0, up: -0.1, forward: 0.3 },
    swing: { out: 0, up: 0.04, forward: 0 },
    count: 4,
    facing: { fingers: "up", palm: "in" },
  };
