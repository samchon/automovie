import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `hairCombing` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Combing: the hand that holds the comb draws it
 * back over the crown.
 */
export const HUMAN_GESTURE_PHRASE_HAIR_COMBING: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeFromPreset =
  {
    phrase: "stroke",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    from: { out: 0, up: 0, forward: 0.1 },
  };
