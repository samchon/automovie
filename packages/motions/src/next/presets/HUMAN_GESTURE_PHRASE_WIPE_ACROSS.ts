import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `wipeAcross` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. Wiping a surface: the flat palm oscillates across
 * the target.
 */
export const HUMAN_GESTURE_PHRASE_WIPE_ACROSS: IAutoMovieMotionHumanGesture.IArmPhrasePhraseSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.15, up: 0, forward: 0 },
    count: 4,
  };
