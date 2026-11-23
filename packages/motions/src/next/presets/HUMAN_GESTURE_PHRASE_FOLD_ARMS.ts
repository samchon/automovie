import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `foldArms` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Folding the arms: each hand visits the far arm before the chest, the forearms folded, and stays (the phrase that reaches `HumanStance.armsCrossed`, which holds the rest itself).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseHandTargetOffsetShapeFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_FOLD_ARMS`; the `foldArms` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_FOLD_ARMS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseHandTargetOffsetShapeFacingHoldPreset =
  {
    phrase: "visit",
    hand: "both",
    target: { kind: "self", region: "solarPlexus" },
    offset: { out: -0.25, up: 0.05, forward: 0.12 },
    shape: "relaxed",
    facing: { fingers: "in", palm: "back" },
    hold: "long",
  };
