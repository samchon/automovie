import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/**
 * The rollUnder preset: the body rolled under a hook. Spread into `defend`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `rollUnder` row of `HumanDefence`
 * fixes these values.
 */
export const HUMAN_DEFENCE_ROLL_UNDER: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "roll",
  };
