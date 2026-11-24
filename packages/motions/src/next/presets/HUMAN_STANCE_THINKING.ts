import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The thinking preset of `rest`: The thinker: the left hand supporting the
 * other elbow, the right fist under the chin. Spread into `rest`'s parameters
 * with the hold; the `thinking` row of `HumanStance` fixes these places. Where
 * each place lies on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 */
export const HUMAN_STANCE_THINKING: IAutoMovieMotionHumanStance.IRestPreset = {
  left: "elbowSupport",
  right: "chinRest",
};
