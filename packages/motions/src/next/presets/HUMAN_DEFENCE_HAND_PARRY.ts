import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/**
 * The handParry preset: the incoming fist deflected by the hand. Spread into
 * `defend`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `handParry` row of
 * `HumanDefence` fixes these values.
 */
export const HUMAN_DEFENCE_HAND_PARRY: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "parry",
  };
