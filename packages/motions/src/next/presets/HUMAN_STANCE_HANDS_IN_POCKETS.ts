import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The handsInPockets preset of `rest`: Hands in the pockets: each palm on the
 * front pocket region of its own thigh. Spread into `rest`'s parameters with
 * the hold; the `handsInPockets` row of `HumanStance` fixes these places. Where
 * each place lies on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_HANDS_IN_POCKETS: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "pocket",
    right: "pocket",
  };
