/**
 * What one set of changed identities invalidates.
 *
 * The unaffected artifacts are reported beside the invalidated ones on purpose.
 * "Only these are stale" is a claim about the complement, and a report that
 * names one side alone cannot be checked.
 *
 * Every list sorts by UTF-16 code unit. A changed id that names no declared
 * subject or derived artifact is refused with an error rather than ignored.
 *
 * @evidence contracts/common.md#principled-implementation Computed by `designLineageImpact` as a breadth-first walk from the changed ids along reversed `inputs` edges of a validated lineage, so an artifact is invalidated exactly when it depends transitively on a changed id and `unaffected` is the rest of the derived set.
 * @evidence contracts/common.md#clear-and-simple-design Three sorted id lists, with the complement stated explicitly so a reader can check that the two derived lists partition every artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown changed id throws instead of being skipped, and a changed id that is itself a derived artifact is counted as invalidated; no artifact kind is exempt from the walk.
 * @evidence contracts/common.md#meaningful-documentation States what was asked, what must be recomputed, what is unaffected, the deduplication and ordering of each list, and the refusal of unknown ids.
 * @author Samchon
 */
export interface IAutoMovieDesignImpact {
  /**
   * Identities the question was asked about, deduplicated, in ascending order.
   * A derived artifact id here is invalidated itself.
   */
  changed: string[];

  /** Derived artifact ids that must be recomputed, in ascending order. */
  invalidated: string[];

  /** Derived artifact ids provably unaffected, in ascending order. */
  unaffected: string[];
}
