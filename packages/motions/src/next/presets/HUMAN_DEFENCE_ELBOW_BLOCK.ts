import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/*
 * The elbowBlock preset: a body strike taken on the elbow. Spread into
 * `defend`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `elbowBlock` row of
 * `HumanDefence` fixes these values.
 */
export const HUMAN_DEFENCE_ELBOW_BLOCK: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "elbowBlock",
  };
