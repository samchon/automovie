import type { IAutoMovieMotionHumanDefence } from "@automovie/interface";

/*
 * The swayBack preset: the trunk swayed back from a strike. Spread into
 * `defend`'s parameters beside the rest that the composition gives; each value
 * means what the law's member of the same name does. The `swayBack` row of
 * `HumanDefence` fixes these values.
 */
export const HUMAN_DEFENCE_SWAY_BACK: IAutoMovieMotionHumanDefence.IDefendPreset =
  {
    kind: "sway",
  };
