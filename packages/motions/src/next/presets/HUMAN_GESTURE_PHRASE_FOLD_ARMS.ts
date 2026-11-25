import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `foldArms` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Folding the arms: each hand visits the far arm
 * before the chest, the forearms folded, and stays (the phrase that reaches
 * `HumanStance.armsCrossed`, which holds the rest itself).
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
