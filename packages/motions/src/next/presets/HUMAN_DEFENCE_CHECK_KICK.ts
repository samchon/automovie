import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/*
 * The checkKick preset: a kick checked with the raised shin. Spread into
 * `defend`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `checkKick` row of
 * `HumanDefence` fixes these values.
 */
export const HUMAN_DEFENCE_CHECK_KICK: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "check",
  };
