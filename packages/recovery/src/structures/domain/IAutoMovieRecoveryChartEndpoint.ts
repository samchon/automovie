/**
 * One exact Coons endpoint and its recipe control index.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fields preserve the producer's coefficient order, units and identities.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces repeated anonymous copies of the same structural value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred geometry or fallback values.
 * @evidence contracts/common.md#meaningful-documentation Members state physical units, field ordering and coefficient-index meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no handles.
 */
export interface IAutoMovieRecoveryChartEndpoint {
  /** Unscaled endpoint position, millimetres. */
  position: readonly [number, number, number];

  /** Index of the endpoint coefficient in the recipe. */
  id: number;
}
