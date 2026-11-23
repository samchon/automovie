/**
 * One semantic reading proposed over raw primitives.
 *
 * A candidate is a proposal, never a conclusion. Competing readings of the same
 * marks cite each other in {@link alternatives}, and anything still undecided is
 * named in {@link issues}; both keep a reading from silently hardening into the
 * design.
 *
 * Promotion reads only this candidate's own lists. Neither link is required to
 * be mutual, so a rival that does not list this candidate back, or an open
 * issue that names this candidate without being listed here, does not block
 * it.
 *
 * At most one `observed` analysis may claim a candidate, and that analysis must
 * have read the frame every one of the candidate's primitives lies on.
 */
export interface IAutoMovieObservedCandidate {
  /** Stable, non-blank candidate identity, unique within the document. */
  id: string;

  /**
   * Non-blank open semantic label such as `wall-centerline`, `opening`, or
   * `storey-datum`.
   */
  semantic: string;

  /** Primitive ids this reading is built from; at least one, distinct. */
  primitives: string[];

  /** Inclusive `[0, 1]` confidence in this reading. */
  confidence: number;

  /**
   * Competing candidate ids reading the same marks differently; distinct and
   * never this candidate's own id. Any entry withholds this candidate.
   */
  alternatives: string[];

  /** Issue ids that block promotion while open; distinct. */
  issues: string[];
}
