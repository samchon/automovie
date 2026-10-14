import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * The effective source-pose document and its one goal-independent prepared rig.
 *
 * Reference-goal conversion retains this rig for final performance. An omitted rig means no conversion was requested, so the ordinary pose owner prepares it from the final shaped landmarks as before. The caller's saved reference goals are not overwritten by this internal document.
 *
 * @evidence contracts/common.md#principled-implementation Effective source-pose rows and an optional goal-independent shaped rig preserve one reference conversion's dependencies for final performance.
 * @evidence contracts/common.md#clear-and-simple-design The preparation result carries the derived internal document beside the reusable rig while the saved authored goals remain caller-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prepared rig is reusable only while anchors remain goal-independent; omitted rig requires ordinary final-landmark preparation.
 * @evidence contracts/common.md#meaningful-documentation Members and prose state internal-document ownership, saved-goal preservation and omitted-rig behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference preparation typing computes no goal conversion or shaped skeleton.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The optional result names reused rig state; preparation and pose owners enforce actual dependency equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Preparation metadata owns no acquired skeleton cache or final-performance task.
 * @author Samchon
 */
export interface IHumanBodyReferenceGoalPreparation {
  /** Internal document whose source-pose rows drive correctives and coordination. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** The same goal-independent shaped rig used by reference conversion and final FK. */
  rig?: IAutoMovieHumanBodySkeletonRig;
}
