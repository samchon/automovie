import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `waveHand` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A wave: the open hand oscillates out and in,
 * raised beside the head, palm forward.
 */
export const HUMAN_GESTURE_PHRASE_WAVE_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.25, up: 0.55, forward: 0.15 },
    swing: { out: 0.1, up: 0, forward: 0 },
    count: 3,
    facing: { fingers: "up", palm: "forward" },
  };
