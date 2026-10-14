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
 * At most one `observed` analysis may claim a candidate, and that analysis
 * must have read the frame every one of the candidate's primitives lies on.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignReference` checks semantic presence, resolving distinct primitive/alternative/issue references, non-self alternatives and confidence in [0, 1]. At most one observed analysis may claim the candidate, and a claimed candidate's primitive frames must match that analysis. No producer is allowed structurally but promotion then withholds it as unobserved; confidence and semantic meaning are authored claims, not independently calibrated or inferred.
 * @evidence contracts/common.md#clear-and-simple-design The candidate carries its own blocking links, so promotion decides from one record without scanning other candidates or issues, and the semantic label stays an open string the building source interprets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Promotion withholds any candidate that lists a rival instead of choosing the more confident reading, and a candidate assembled from marks on another sheet is refused rather than given the claiming analysis's scale.
 * @evidence contracts/common.md#meaningful-documentation States that the record is a proposal, that only its own lists block it and neither link must be mutual, the uniqueness and resolution of each list, the confidence range, and the single-analysis, single-frame rule.
 * @author Samchon
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
