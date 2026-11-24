import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `cheekInHand` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A hand to the cheek: the palm visits the cheek
 * and stays a beat.
 */
export const HUMAN_GESTURE_PHRASE_CHEEK_IN_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "cheekRight" },
    mirror: true,
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  };
