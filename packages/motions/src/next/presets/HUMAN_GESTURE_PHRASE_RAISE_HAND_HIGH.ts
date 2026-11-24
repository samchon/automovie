import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `raiseHandHigh` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A raised hand: the open hand visits a place above
 * the shoulder, palm forward, and holds it.
 */
export const HUMAN_GESTURE_PHRASE_RAISE_HAND_HIGH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.1, up: 0.9, forward: 0.1 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  };
