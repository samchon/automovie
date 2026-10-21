import type { IAutoMovieRecoverySceneCandidate } from "./IAutoMovieRecoverySceneCandidate";

/**
 * One support-ranked camera candidate at an accepted component revision.
 *
 * @evidence contracts/common.md#principled-implementation The target source index and distinct existing-map pairs expose the actual support used for ordering, without assigning a pose.
 * @evidence contracts/common.md#clear-and-simple-design One named internal record keeps the ordering population with the attempted camera.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Count is not geometric acceptance or a filename trajectory prior.
 * @evidence contracts/common.md#meaningful-documentation Members identify source and shared revision-local support.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased queue item performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Support is shared with the revision ledger and discarded after acceptance changes geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Call-local borrowed arrays acquire no resource.
 */
export interface IAutoMovieRecoverySceneQueue {
  /** Fixed input source index. */
  view: number;

  /** Distinct existing-map candidates, not PnP inliers. */
  candidates: IAutoMovieRecoverySceneCandidate[];
}
