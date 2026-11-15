import type { IAutoMoviePose } from "@automovie/interface";

import type { IAutoMovieSwivelSeed } from "../kinematics/IAutoMovieSwivelSeed";

/**
 * A chain fit with the seed that continues it: the fitted pose, and the
 * branch and swivel of its hinged candidate when that candidate is the
 * answer (`fitSeededChainToTarget`).
 *
 * @evidence contracts/development/design.md#principled-representation The pose a fit returns and the two numbers that name its hinged candidate for any target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the answer and its seed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`; null states there is no seed rather than inventing one.
 * @evidence contracts/development/common.md#meaningful-documentation States both members and when the seed is null.
 */
export interface IAutoMovieSeededChainFit {
  /** The fitted pose, as `fitChainToTarget` returns it. */
  pose: IAutoMoviePose;

  /** The seed of the hinged candidate that is the answer; null when another candidate, or none, is. */
  seed: IAutoMovieSwivelSeed | null;
}
