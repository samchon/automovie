/**
 * Counts of observations and emitted coefficient populations in a section publication.
 *
 * @evidence contracts/development/design.md#principled-representation Separate counts expose the relationship between source observations, fitted spans and declared topology.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The saved publication carries aggregate scalar counts without retaining source geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These counts do not certify geometric quality or compression against every source feature.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
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
