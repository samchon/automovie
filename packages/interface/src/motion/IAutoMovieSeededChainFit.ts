import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSwivelSeed } from "../pose/IAutoMovieSwivelSeed";
import type { IAutoMovieChainFitScore } from "./IAutoMovieChainFitScore";

/**
 * A chain fit with the seed that continues it: the fitted pose, and the branch
 * and swivel of its hinged candidate when that candidate is the answer
 * (`fitSeededChainToTarget`).
 */
export interface IAutoMovieSeededChainFit {
  /**
   * Fitted pose, possibly the original input when no better candidate is found;
   * unchanged members and joint records may be shared. Treat it as immutable
   * when caching.
   */
  pose: IAutoMoviePose;

  /**
   * The seed of the hinged candidate that is the answer; null when another
   * candidate, or none, is.
   */
  seed: IAutoMovieSwivelSeed | null;

  /**
   * What the answer scored, when it is a hinged candidate fitted with a strain
   * (`fitChainToTarget`'s `strain`): its overshoot in degrees, 0 when it is
   * legal; the hand's rotation error in degrees, the least over the legal
   * swivels to within the joints' tolerance; and the secondary score of the
   * swivel chosen among those. With a positive overshoot no swivel is legal and
   * the error and the strain are the least-overshoot candidate's. Absent for
   * any other fit.
   */
  value?: IAutoMovieChainFitScore;
}
