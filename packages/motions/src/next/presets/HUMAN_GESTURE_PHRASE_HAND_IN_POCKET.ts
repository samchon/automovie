import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `handInPocket` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A hand in the pocket: the fingertips visit the
 * front pocket and stay.
 */
export const HUMAN_GESTURE_PHRASE_HAND_IN_POCKET: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "pocketFrontRight" },
    mirror: true,
    surface: "indexTip",
    shape: "relaxed",
    hold: "long",
  };
