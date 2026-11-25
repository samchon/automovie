import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `armAtSide` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. An arm at rest at the side: the relaxed hand
 * visits a place beside the thigh, palm in, and stays.
 */
export const HUMAN_GESTURE_PHRASE_ARM_AT_SIDE: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetShapeFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0.12, up: -0.1, forward: 0 },
    shape: "relaxed",
    facing: { fingers: "down", palm: "in" },
    hold: "long",
  };
