import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `handBehindHead` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A hand behind the head: the palm visits the back
 * of the head and stays.
 */
export const HUMAN_GESTURE_PHRASE_HAND_BEHIND_HEAD: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "headBack" },
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  };
