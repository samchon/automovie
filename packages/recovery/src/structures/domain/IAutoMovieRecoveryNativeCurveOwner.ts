/**
 * A complete native cubic coefficient owner retained by a chart.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fields preserve the producer's coefficient order, units and identities.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces repeated anonymous copies of the same structural value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration supplies no inferred geometry or fallback values.
 * @evidence contracts/common.md#meaningful-documentation Members state physical units, field ordering and coefficient-index meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records are caller-owned and acquire no handles.
 */
export interface IAutoMovieRecoveryNativeCurveOwner {
  /** Native cubic authority identity. */
  id: string;

  /** Ordered complete cubic owner indices in the recipe. */
  controlIds: [number, number, number, number];

  /** Original ordered cubic control net, millimetres. */
  net: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
}
