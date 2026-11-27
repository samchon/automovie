import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `teethBrushing` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Brushing the teeth: the hand that holds the brush
 * oscillates before the mouth.
 */
export const HUMAN_GESTURE_PHRASE_TEETH_BRUSHING: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    swing: { out: 0.04, up: 0, forward: 0 },
    count: 6,
  };
