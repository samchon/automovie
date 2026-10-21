/**
 * One complete positive-depth pixel score on a fixed resection population.
 *
 * @evidence contracts/common.md#principled-implementation Distinct population indices pass the same Euclidean pixel gate; clipped squared error breaks support-count ties.
 * @evidence contracts/common.md#clear-and-simple-design One named score serves consensus selection and opt-in diagnostic events.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Indices are fitted support, not material-truth labels or independent evidence.
 * @evidence contracts/common.md#meaningful-documentation Members state index ownership and squared-pixel clipping units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased score performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The consensus owner scores once and shares the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A call-owned O(N) index list has no resource handle.
 */
export interface IAutoMovieRecoveryResectionScore {
  /** Ascending indices in the unchanged 3D/pixel input arrays. */
  indices: number[];

  /** Sum of squared pixel errors clipped at the declared support threshold. */
  cost: number;
}
