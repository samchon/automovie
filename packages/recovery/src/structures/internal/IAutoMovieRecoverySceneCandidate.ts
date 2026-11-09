import type { IAutoMovieRecoveryMapObservation } from "../image/IAutoMovieRecoveryMapObservation";

/**
 * Distinct existing landmark and one target-image measurement.
 *
 * @evidence contracts/development/design.md#principled-representation Fixed landmark-array identity and global nonconflicting feature identity form an existing-map resection candidate, not an inlier.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal record serves support ordering and the actual resection call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It supplies no target pose, new 3D point or material-truth label.
 * @evidence contracts/development/common.md#meaningful-documentation Members state array ownership and target measurement semantics.
 */
export interface IAutoMovieRecoverySceneCandidate {
  /** Index in the accepted landmark array for this revision. */
  landmark: number;

  /** Fixed target measurement from the same global component. */
  observation: IAutoMovieRecoveryMapObservation;
}
