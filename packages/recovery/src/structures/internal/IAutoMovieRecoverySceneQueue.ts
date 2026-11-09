import type { IAutoMovieRecoverySceneCandidate } from "./IAutoMovieRecoverySceneCandidate";

/**
 * One support-ranked camera candidate at an accepted component revision.
 *
 * @evidence contracts/development/design.md#principled-representation The target source index and distinct existing-map pairs expose the actual support used for ordering, without assigning a pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal record keeps the ordering population with the attempted camera.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Count is not geometric acceptance or a filename trajectory prior.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify source and shared revision-local support.
 */
export interface IAutoMovieRecoverySceneQueue {
  /** Fixed input source index. */
  view: number;

  /** Distinct existing-map candidates, not PnP inliers. */
  candidates: IAutoMovieRecoverySceneCandidate[];
}
