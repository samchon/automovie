/**
 * Exact rational frame rate for a production timeline.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Preserves fractional frame rates as authored rational values whose identity survives reduction instead of a lossy decimal proxy.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Defines the portable numerator and denominator consumed by timeline calculations.
 */
export interface IAutoMovieProductionFrameRate {
  /**
   * Positive integer numerator.
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Preserves the authored rate numerator of the canonical rational rate.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Supplies the canonical clock numerator.
   */
  numerator: number;

  /**
   * Positive integer denominator.
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Preserves the authored positive rate denominator of the canonical rational rate.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Supplies the canonical clock denominator.
   */
  denominator: number;
}
