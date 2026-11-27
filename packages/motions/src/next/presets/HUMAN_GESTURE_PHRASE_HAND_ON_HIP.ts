import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `handOnHip` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Hand on the hip: the palm visits the near hip and
 * stays.
 */
export const HUMAN_GESTURE_PHRASE_HAND_ON_HIP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    surface: "palm",
    shape: "flat",
    hold: "long",
  };
