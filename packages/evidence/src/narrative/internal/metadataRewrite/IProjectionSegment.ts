/**
 * Maps one contiguous protected byte span back to the immutable source.
 *
 * @evidence contracts/common.md#principled-implementation A contiguous protected span records original and projected starts and byte length.
 * @evidence contracts/common.md#clear-and-simple-design The mapping reconnects projection mismatches to untouched source positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only protected spans are mapped; owned metadata receives no fabricated coordinates.
 * @evidence contracts/common.md#meaningful-documentation Properties distinguish original and projected byte coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IProjectionSegment {
  /** Byte offset of the protected span in the original file. */
  originalStart: number;

  /** Byte offset of the span after owned metadata is removed. */
  projectedStart: number;

  /** Number of bytes retained unchanged in this span. */
  length: number;
}
