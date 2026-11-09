import type { IAutoMovieRecoveryMapObservation } from "./IAutoMovieRecoveryMapObservation";

/**
 * Sparse conditional fitting evidence, not an authored surface or metric point.
 *
 * @evidence contracts/development/design.md#principled-representation One nonconflicting automatic feature component supplies at most one observation per image and one finite position in the common seed gauge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named owned record keeps identity, coordinate and retained measurements together through refinement/publication.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No dense mesh, invisible completion, material-truth certificate or physical unit is implied by this provisional landmark.
 * @evidence contracts/development/common.md#meaningful-documentation Members specify component identity, common length gauge and observed-image support.
 */
export interface IAutoMovieRecoveryMapLandmark {
  /** Deterministic linked-feature component identity within this operation. */
  id: number;

  /** World coordinate in first-camera axes and unit seed-baseline length. */
  point: [number, number, number];

  /** Distinct-view observations retained by explicit geometry gates; absent images remain unobserved. */
  observations: IAutoMovieRecoveryMapObservation[];
}
