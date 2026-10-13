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
 * @author Samchon
 */
export interface IAutoMovieObservedCandidate {
  /** Stable candidate identity within the document. */
  id: string;

  /**
   * Open semantic label such as `wall-centerline`, `opening`, `storey-datum`.
   */
  semantic: string;

  /** Primitive ids this reading is built from; at least one. */
  primitives: string[];

  /** Inclusive `[0, 1]` confidence in this reading. */
  confidence: number;

  /** Competing candidate ids reading the same marks differently; distinct. */
  alternatives: string[];

  /** Issue ids that block promotion while open; distinct. */
  issues: string[];
}
