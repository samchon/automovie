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
 * @evidence contracts/common.md#principled-implementation A semantic proposal over at least one resolving primitive with confidence in `[0, 1]` and distinct alternative and issue ids; promotion withholds it while any alternative is listed or any listed issue is open, but neither link is checked for symmetry, so one side of a disagreement can still promote.
 * @evidence contracts/common.md#clear-and-simple-design Six fields; competition and open questions are id lists, so settling them changes the lists and never the reading itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic label is interpreted and a candidate may not name itself as an alternative; the asymmetric alternative and issue links are a defect stated here rather than compensated for.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, semantic examples, the primitive floor, the confidence range, what each list does to promotion, and that only this candidate's own lists count.
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
