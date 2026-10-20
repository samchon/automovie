import type { IAutoMovieRecoveryMapObservation } from "../image/IAutoMovieRecoveryMapObservation";

/**
 * Distinct existing landmark and one target-image measurement.
 *
 * @evidence contracts/common.md#principled-implementation Fixed landmark-array identity and global nonconflicting feature identity form an existing-map resection candidate, not an inlier.
 * @evidence contracts/common.md#clear-and-simple-design One named internal record serves support ordering and the actual resection call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It supplies no target pose, new 3D point or material-truth label.
 * @evidence contracts/common.md#meaningful-documentation Members state array ownership and target measurement semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no matching or fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The coordinator invalidates support after each accepted revision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Call-local borrowed observations acquire no resource.
 */
export interface IAutoMovieRecoverySceneCandidate {
  /** Index in the accepted landmark array for this revision. */
  landmark: number;

  /** Fixed target measurement from the same global component. */
  observation: IAutoMovieRecoveryMapObservation;
}
