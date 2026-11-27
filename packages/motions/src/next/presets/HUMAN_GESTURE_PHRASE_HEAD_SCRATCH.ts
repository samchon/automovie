import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `headScratch` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Scratching the head: the forefinger's tip
 * oscillates on the crown.
 */
export const HUMAN_GESTURE_PHRASE_HEAD_SCRATCH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "crown" },
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0, forward: 0.03 },
    count: 4,
  };
