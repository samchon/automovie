import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMovieSwivelSeed } from "../pose/IAutoMovieSwivelSeed";
import type { IAutoMovieChainFitScore } from "./IAutoMovieChainFitScore";

/**
 * Clinical articulation of a two-link target candidate before final clamping.
 * The caller evaluates its effective ROM and actual FK residual; this record
 * carries no claim that the target is reachable or that contact succeeded.
 */
export interface IAutoMovieSolvedChainPlant {
  /** Root joint's selected clinical coordinate chart. */
  upper: IAutoMovieJointPose;

  /** Mid joint's selected clinical coordinate chart. */
  lower: IAutoMovieJointPose;

  /** Original hinge direction in the resolved model frame. */
  hinge: IAutoMovieVector3;

  /**
   * Metres the candidate rests short of (or past) the target along the line
   * from the chain root, because the distance lies outside the chain's span or
   * its mid joint stopped at a limit of its flexion range. Zero means the
   * hinged branch reaches that distance; absent means the non-hinged producer
   * did not report radial shortfall and makes no reachability claim.
   */
  shortfall?: number;

  /**
   * The branch and swivel a hinged chain's candidate was chosen at, the seed a
   * fit of a nearby target continues from (`IAutoMovieSwivelNear`); absent for
   * a candidate of another chain.
   */
  seed?: IAutoMovieSwivelSeed;

  /**
   * What a hinged chain's candidate fitted with a strain scored
   * (`IAutoMovieSeededChainFit.value`); absent otherwise.
   */
  value?: IAutoMovieChainFitScore;
}
