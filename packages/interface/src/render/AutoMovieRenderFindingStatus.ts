/**
 * Outcome of one render-cost metric against its explicitly declared budget, or
 * its analysis gap.
 */
export type AutoMovieRenderFindingStatus =
  | "within"
  | "over"
  | "unbudgeted"
  | "unsupported"
  | "not-run";
