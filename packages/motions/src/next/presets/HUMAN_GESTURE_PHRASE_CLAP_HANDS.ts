import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `clapHands` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Clapping: both palms meet ahead of the chest and
 * part, out and in.
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
