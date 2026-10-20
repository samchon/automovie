/**
 * Counts of observations and emitted coefficient populations in a section publication.
 *
 * @evidence contracts/common.md#principled-implementation Separate counts expose the relationship between source observations, fitted spans and declared topology.
 * @evidence contracts/common.md#clear-and-simple-design The saved publication carries aggregate scalar counts without retaining source geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These counts do not certify geometric quality or compression against every source feature.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the declared records and arrays.
 */
export interface IAutoMovieRecoverySectionSummary {
  /** Number of physical observations supplied to curve fitting. */
  observations: number;

  /** Total emitted cubic span count. */
  spans: number;

  /** Number of retained physical sections. */
  sections: number;

  /** Number of declared reconstruction events. */
  events: number;

  /** Number of exact source-position aliases retained by extraction. */
  aliases: number;
}
