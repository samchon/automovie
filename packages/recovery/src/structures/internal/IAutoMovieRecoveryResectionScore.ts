/**
 * One complete positive-depth pixel score on a fixed resection population.
 *
 * @evidence contracts/development/design.md#principled-representation Distinct population indices pass the same Euclidean pixel gate; clipped squared error breaks support-count ties.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named score serves consensus selection and opt-in diagnostic events.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices are fitted support, not material-truth labels or independent evidence.
 * @evidence contracts/development/common.md#meaningful-documentation Members state index ownership and squared-pixel clipping units.
 */
export interface IAutoMovieRecoveryResectionScore {
  /** Ascending indices in the unchanged 3D/pixel input arrays. */
  indices: number[];

  /** Sum of squared pixel errors clipped at the declared support threshold. */
  cost: number;
}
