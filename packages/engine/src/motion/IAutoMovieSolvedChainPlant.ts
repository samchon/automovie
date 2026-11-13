import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Clinical articulation of a two-link target candidate before final clamping.
 * The caller evaluates its effective ROM and actual FK residual; this record
 * carries no claim that the target is reachable or that contact succeeded.
 *
 * @evidence contracts/development/design.md#principled-representation Stores the two clinical articulations derived from a prepared geometric chain and its original resolved hinge, leaving final domain clamping and FK residual admission to fitChainToTarget.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One candidate record separates a geometric solve from the caller's effective-ROM and continuity decision, so a computed candidate cannot imply an accepted contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No residual is replaced by a success flag in this result; the caller must evaluate actual contact under its skeleton's constraints.
 * @evidence contracts/development/common.md#meaningful-documentation States the pre-clamp status, selected clinical charts, resolved-model hinge frame and absence of reachability certification.
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
   * from the chain root, because the distance lies outside the chain's span
   * or its mid joint stopped at a limit of its flexion range; absent or `0`
   * when a legal hinge angle reaches the distance.
   */
  shortfall?: number;
}
