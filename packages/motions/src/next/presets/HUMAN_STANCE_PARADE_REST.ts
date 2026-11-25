import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The paradeRest preset of `rest`: Parade rest: the hands clasped behind the
 * back, on the sacrum. Spread into `rest`'s parameters with the hold; the
 * `paradeRest` row of `HumanStance` fixes these places. Where each place lies
 * on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_PARADE_REST: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "claspedBehind",
    right: "claspedBehind",
  };
