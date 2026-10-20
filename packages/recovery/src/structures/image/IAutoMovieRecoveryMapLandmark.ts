import type { IAutoMovieRecoveryMapObservation } from "./IAutoMovieRecoveryMapObservation";

/**
 * Sparse conditional fitting evidence, not an authored surface or metric point.
 *
 * @evidence contracts/common.md#principled-implementation One nonconflicting automatic feature component supplies at most one observation per image and one finite position in the common seed gauge.
 * @evidence contracts/common.md#clear-and-simple-design A named owned record keeps identity, coordinate and retained measurements together through refinement/publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No dense mesh, invisible completion, material-truth certificate or physical unit is implied by this provisional landmark.
 * @evidence contracts/common.md#meaningful-documentation Members specify component identity, common length gauge and observed-image support.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record computes no geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns ordinary arrays and no external resource.
 */
export interface IAutoMovieRecoveryMapLandmark {
  /** Deterministic linked-feature component identity within this operation. */
  id: number;

  /** World coordinate in first-camera axes and unit seed-baseline length. */
  point: [number, number, number];

  /** Distinct-view observations retained by explicit geometry gates; absent images remain unobserved. */
  observations: IAutoMovieRecoveryMapObservation[];
}
