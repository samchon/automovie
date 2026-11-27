import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `hatOnHead` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Putting on a hat: the hand that holds it visits
 * the crown and stays a beat.
 */
export const HUMAN_GESTURE_PHRASE_HAT_ON_HEAD: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  };
