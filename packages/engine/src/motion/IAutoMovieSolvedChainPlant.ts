import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Clinical articulation of a two-link target candidate before final clamping.
 * The caller evaluates its effective ROM and actual FK residual; this record
 * carries no claim that the target is reachable or that contact succeeded.
 *
 * @evidence contracts/common.md#principled-implementation Stores the two clinical articulations derived from a prepared geometric chain and its original resolved hinge, leaving final domain clamping and FK residual admission to fitChainToTarget.
 * @evidence contracts/common.md#clear-and-simple-design One candidate record separates a geometric solve from the caller's effective-ROM and continuity decision, so a computed candidate cannot imply an accepted contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No residual is replaced by a success flag in this result; the caller must evaluate actual contact under its skeleton's constraints.
 * @evidence contracts/common.md#meaningful-documentation States the pre-clamp status, selected clinical charts, resolved-model hinge frame and absence of reachability certification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This candidate data type executes neither the two-link solve nor clinical-angle decomposition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Upper and lower candidates share prepared geometry through their producer; the result defines no candidate cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The candidate owns two joint records and one hinge reference, with no retained search task or external resource.
 *
 * @author Samchon
 */
export interface IAutoMovieSolvedChainPlant {
  /** Root joint's selected clinical coordinate chart. */
  upper: IAutoMovieJointPose;

  /** Mid joint's selected clinical coordinate chart. */
  lower: IAutoMovieJointPose;

  /** Original hinge direction in the resolved model frame. */
  hinge: IAutoMovieVector3;
}
