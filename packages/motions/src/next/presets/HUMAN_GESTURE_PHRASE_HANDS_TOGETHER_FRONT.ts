import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `handsTogetherFront` row of `HumanUpperRows` fixes on
 * `armPhrase`, spread into its parameters. Hands clasped in front: both palms
 * meet before the abdomen and stay.
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
