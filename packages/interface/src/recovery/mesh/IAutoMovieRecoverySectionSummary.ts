/**
 * Counts of observations and emitted coefficient populations in a section
 * publication.
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
