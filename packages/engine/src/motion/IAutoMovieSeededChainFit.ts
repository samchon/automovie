import type { IAutoMoviePose } from "@automovie/interface";

import type { IAutoMovieSwivelSeed } from "../kinematics/IAutoMovieSwivelSeed";

/**
 * A chain fit with the seed that continues it: the fitted pose, and the
 * branch and swivel of its hinged candidate when that candidate is the
 * answer (`fitSeededChainToTarget`).
 *
 * @evidence contracts/development/design.md#principled-representation The pose a fit returns and the two numbers that name its hinged candidate for any target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The answer, its seed and, for a fit with a strain, the value it was chosen by, which a caller ranking keys by their fits reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`; null states there is no seed rather than inventing one.
 * @evidence contracts/development/common.md#meaningful-documentation States both members and when the seed is null.
 */
export interface IAutoMovieSeededChainFit {
  /** The fitted pose, as `fitChainToTarget` returns it. */
  pose: IAutoMoviePose;

  /** The seed of the hinged candidate that is the answer; null when another candidate, or none, is. */
  seed: IAutoMovieSwivelSeed | null;

  /**
   * What the answer scored, when it is a hinged candidate fitted with a
   * strain (`fitChainToTarget`'s `strain`): its overshoot in degrees, 0
   * when it is legal; the hand's rotation error in degrees, the least over
   * the legal swivels to within the joints' tolerance; and the strain of the
   * swivel chosen among those. With a positive overshoot no swivel is legal
   * and the error and the strain are the least-overshoot candidate's. Absent
   * for any other fit.
   */
  value?: { overshoot: number; error: number; strain: number };
}
