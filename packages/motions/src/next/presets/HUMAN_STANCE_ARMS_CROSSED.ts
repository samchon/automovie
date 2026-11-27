import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The armsCrossed preset of `rest`: Arms crossed on the chest: each hand on the
 * front of the other upper arm. Spread into `rest`'s parameters with the hold;
 * the `armsCrossed` row of `HumanStance` fixes these places. Where each place
 * lies on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_ARMS_CROSSED: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "crossed",
    right: "crossed",
  };
