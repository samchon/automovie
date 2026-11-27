import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The handsOnHips preset of `rest`: Hands on the hips: each palm on the side of
 * its own pelvis, the elbows out. Spread into `rest`'s parameters with the
 * hold; the `handsOnHips` row of `HumanStance` fixes these places. Where each
 * place lies on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_HANDS_ON_HIPS: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "hip",
    right: "hip",
  };
