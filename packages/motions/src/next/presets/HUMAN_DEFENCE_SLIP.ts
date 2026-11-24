import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/**
 * The slip preset: the head moved off the line of a straight punch. Spread into
 * `defend`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `slip` row of
 * `HumanDefence` fixes these values.
 */
export const HUMAN_DEFENCE_SLIP: IAutoMovieMotionHumanDefence.IDefendPreset = {
  kind: "slip",
};
