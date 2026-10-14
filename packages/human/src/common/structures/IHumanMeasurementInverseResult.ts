/**
 * The weight a measurement inverse selected and the reading it gives.
 *
 *
 * @evidence contracts/common.md#principled-implementation The selected weight is paired with the caller's actual metre reading at that same weight.
 * @evidence contracts/common.md#clear-and-simple-design A two-value result distinguishes parameter selection from the measured quantity rather than returning the target as the observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned reading does not certify personal anatomy or a solution outside the solver's declared weight range.
 * @evidence contracts/common.md#meaningful-documentation Members identify dimensionless channel weight and the actual metre reading at that weight.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Measurement-inverse selected result is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Measurement-inverse selected result specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Measurement-inverse selected result acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanMeasurementInverseResult {
  /** Selected channel weight. */
  weight: number;

  /** The caller's reading at `weight`, in metres. */
  actualMetres: number;
}
