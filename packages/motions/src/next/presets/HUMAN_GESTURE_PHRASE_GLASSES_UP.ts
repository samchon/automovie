import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `glassesUp` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Pushing up one's glasses: the forefinger's tip
 * visits the bridge of the nose.
 */
export const HUMAN_GESTURE_PHRASE_GLASSES_UP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "noseBridge" },
    surface: "indexTip",
    shape: "point",
    hold: "none",
  };
