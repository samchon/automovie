import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The handsClasped preset of `rest`: The hands clasped in front of the pelvis.
 * Spread into `rest`'s parameters with the hold; the `handsClasped` row of
 * `HumanStance` fixes these places. Where each place lies on the body and how a
 * hand reaches it is stated on `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_HANDS_CLASPED: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "claspedFront",
    right: "claspedFront",
  };
