import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `clapHands` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Clapping: both palms meet ahead of the chest and
 * part, out and in.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetSwingCountFacingPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_CLAP_HANDS`; the `clapHands` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_CLAP_HANDS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    hand: "both",
    target: { kind: "self", region: "sternum" },
    offset: { out: 0, up: 0, forward: 0.35 },
    swing: { out: 0.08, up: 0, forward: 0 },
    count: 3,
    facing: { fingers: "up", palm: "in" },
  };
