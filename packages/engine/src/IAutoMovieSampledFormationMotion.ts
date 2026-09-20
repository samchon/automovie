import { IAutoMovieFormationMotionState } from "@automovie/interface";
import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";

/**
 * One sampled unit state, with the arrangement it is travelling toward.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Represents a complete repeatable motion answer at one requested film time.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Keeps translation, facing, spacing, and reform state independent of seek order.
 */
export interface IAutoMovieSampledFormationMotion extends IAutoMovieFormationMotionState {
  /**
   * The re-form under way, or null when the unit keeps its designed
   * arrangement. Null rather than an identity re-form, because "no target" and
   * "a target identical to the design" are different statements and only the
   * first is what a unit with no cue is doing.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Preserves whether a deterministic sample is actively reforming instead of collapsing absence into an identity target.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Makes the sampled arrangement state explicit for replay and compatibility checks.
   */
  reform: IAutoMovieFormationReform | null;
}
