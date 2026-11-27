import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `beckonHand` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A beckon: the open hand held out ahead, palm up,
 * draws in toward the chest and out again.
 */
export const HUMAN_GESTURE_PHRASE_BECKON_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0, up: -0.2, forward: 0.5 },
    swing: { out: 0, up: 0, forward: 0.08 },
    count: 3,
    facing: { fingers: "forward", palm: "up" },
  };
