import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `stopHand` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A stop sign: the open hand held out ahead at
 * shoulder height, palm forward.
 */
export const HUMAN_GESTURE_PHRASE_STOP_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0, up: 0, forward: 0.8 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  };
