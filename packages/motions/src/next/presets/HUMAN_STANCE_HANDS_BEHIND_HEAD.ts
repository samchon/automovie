import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The handsBehindHead preset of `rest`: The hands behind the head, the elbows
 * wide. Spread into `rest`'s parameters with the hold; the `handsBehindHead`
 * row of `HumanStance` fixes these places. Where each place lies on the body
 * and how a hand reaches it is stated on `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_HANDS_BEHIND_HEAD: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "behindHead",
    right: "behindHead",
  };
