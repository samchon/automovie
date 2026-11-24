import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `palmUp` row of `HumanUpperRows` fixes on `armPhrase`, spread
 * into its parameters. Palms up: the open hand held out ahead at waist height,
 * palm up.
 */
export const HUMAN_GESTURE_PHRASE_PALM_UP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0, up: 0.1, forward: 0.4 },
    facing: { fingers: "forward", palm: "up" },
    hold: "beat",
  };
