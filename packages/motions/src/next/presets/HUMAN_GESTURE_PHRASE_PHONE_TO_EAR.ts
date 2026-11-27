import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `phoneToEar` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A phone to the ear: the hand that holds it visits
 * the ear and stays.
 */
export const HUMAN_GESTURE_PHRASE_PHONE_TO_EAR: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "earRight" },
    mirror: true,
    surface: "grip",
    shape: "fist",
    hold: "long",
  };
