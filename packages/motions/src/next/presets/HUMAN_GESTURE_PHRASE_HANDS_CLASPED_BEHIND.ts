import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `handsClaspedBehind` row of `HumanUpperRows` fixes on
 * `armPhrase`, spread into its parameters. Hands clasped behind: both palms
 * meet behind the lower back and stay.
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
