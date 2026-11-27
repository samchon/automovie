import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `cheerHands` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A cheer: both open hands visit places above and
 * beside the head, palms forward, for a beat.
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
