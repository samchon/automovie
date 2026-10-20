/**
 * Ordered model-space construction line generated from the same coefficients as skin.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the producer's original identities, units and range semantics.
 * @evidence contracts/common.md#clear-and-simple-design A shared named interface replaces the anonymous nested record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type infers no observations and supplies no generated geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state address, range or model-space position meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No runtime cache is defined.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records belong to the caller and hold no resource handles.
 */
export interface IAutoMovieRecoveryConstructionLine {
  /** Stable identity within this saved publication. */
  id: string;

  /** Declared closure topology of the generating course. */
  closed: boolean;

  /** Ordered generated construction positions, metres. */
  points: [number, number, number][];
}
