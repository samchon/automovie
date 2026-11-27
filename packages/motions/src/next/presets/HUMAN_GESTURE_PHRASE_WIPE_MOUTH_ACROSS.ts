import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `wipeMouthAcross` row of `HumanUpperRows` fixes on
 * `armPhrase`, spread into its parameters. Wiping the mouth: the back of the
 * hand draws across the lips.
 */
export const HUMAN_GESTURE_PHRASE_WIPE_MOUTH_ACROSS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeFromPreset =
  {
    phrase: "stroke",
    target: { kind: "self", region: "mouth" },
    surface: "handBack",
    shape: "relaxed",
    from: { out: 0.08, up: 0, forward: 0 },
  };
