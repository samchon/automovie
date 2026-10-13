import { IAutoMovieFormationMotionState } from "@automovie/interface";

import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";

/** One sampled unit state, with the arrangement it is travelling toward. */
export interface IAutoMovieSampledFormationMotion extends IAutoMovieFormationMotionState {
  /**
   * The re-form under way, or null when the unit keeps its designed
   * arrangement. Null rather than an identity re-form, because "no target" and
   * "a target identical to the design" are different statements and only the
   * first is what a unit with no cue is doing.
   */
  reform: IAutoMovieFormationReform | null;
}
