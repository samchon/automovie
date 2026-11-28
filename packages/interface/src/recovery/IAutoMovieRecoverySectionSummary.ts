/**
 * Measurements from automatic section extraction and its fitted curve
 * collection.
 */
export interface IAutoMovieRecoverySectionSummary {
  /**
   * Number of physical points supplied to successful contour fits across
   * retained sections.
   */
  observations: number;

  /**
   * Number of cubic spans emitted by retained contour fits, including open
   * fits.
   */
  spans: number;

  /** Number of cached and retained automatic section stations. */
  sections: number;

  /**
   * Number of bracketed reconstruction event candidates before partitioning
   * into declared and unconsumed events.
   */
  events: number;

  /**
   * Number of redundant exact-coordinate vertices accounted for by the selected
   * alias policy.
   */
  aliases: number;
}
