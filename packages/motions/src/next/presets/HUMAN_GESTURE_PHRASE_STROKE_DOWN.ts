import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `strokeDown` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A stroke: the palm draws down along the target.
 */
export const HUMAN_GESTURE_PHRASE_STROKE_DOWN: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeFromPreset =
  {
    phrase: "stroke",
    surface: "palm",
    shape: "flat",
    from: { out: 0, up: 0.1, forward: 0 },
  };
