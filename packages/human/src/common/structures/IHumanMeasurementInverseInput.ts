/**
 * One bounded, one-dimensional measurement inverse: the channel weight range,
 * the existing weight, the metric target and the caller's reader.
 *
 *
 * @evidence contracts/common.md#principled-implementation A finite ordered weight interval, its current weight, metre target and synchronous caller reader define one scalar inverse problem.
 * @evidence contracts/common.md#clear-and-simple-design The inverse solver owns bracketing while the supplied reader owns the actual geometry and metric at each weight.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape does not assert monotonicity or force an unattainable target; invertHumanMeasurement validates finite readings and reports its existing refusals.
 * @evidence contracts/common.md#meaningful-documentation Members specify weight-domain containment, unchanged equal-target behavior, metre quantities and the refusal label.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Bounded measurement-inverse input is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Bounded measurement-inverse input specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Bounded measurement-inverse input acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanMeasurementInverseInput {
  /** Finite ordered channel weight range containing `current`. */
  range: [number, number];

  /** Existing channel weight, returned unchanged when the target already reads equal. */
  current: number;

  /** Requested reading, in metres. */
  targetMetres: number;

  /**
   * The caller's reading at one weight, in metres.
   *
   * @evidence contracts/common.md#principled-implementation Each finite scalar weight must read the same caller-owned geometry/metric in metres for the inverse's bracket comparisons.
   * @evidence contracts/common.md#clear-and-simple-design The synchronous callback supplies only the metric; invertHumanMeasurement owns range validation, trials and selected result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback cannot replace its actual observation with the requested target or imply monotonicity that the solver has not established.
   * @evidence contracts/common.md#meaningful-documentation The member identifies weight and metre output; the enclosing input describes current weight, bounded range and target.
   * @evidence contracts/performance.md#efficient-algorithms Reader cost depends on the supplied geometry evaluator; the inverse counts its own bounded scalar trials without claiming a constant-cost geometry read.
   * @evidence contracts/performance.md#reuse-equivalent-work The solver reuses each trial reading in its own comparisons; source-specific readers own any immutable basis correspondence reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback is caller-owned and synchronous; any captured basis lifetime belongs to that caller and no task or handle is acquired by this signature.
   */
  read: (weight: number) => number;

  /** Measurement name stated in refusals. */
  label: string;
}
