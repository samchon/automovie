/**
 * Co-charted scalar observations at one physical row.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fields preserve the producer's coefficient order, units and identities.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces repeated anonymous copies of the same structural value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred geometry or fallback values.
 * @evidence contracts/common.md#meaningful-documentation Members state physical units, field ordering and coefficient-index meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no handles.
 */
export interface IAutoMovieRecoveryImageProfileSample<
  T extends number[] = number[],
> {
  /** Physical model Y coordinate, millimetres. */
  yMm: number;

  /** Ordered section-family scalar fields, millimetres. */
  values: T;
}
