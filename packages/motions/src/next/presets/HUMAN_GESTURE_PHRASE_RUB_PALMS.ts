import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `rubPalms` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Rubbing the hands: both palms together ahead of
 * the chest, sliding up and down.
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
