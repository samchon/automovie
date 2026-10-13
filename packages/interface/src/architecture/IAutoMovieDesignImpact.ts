/**
 * What one set of changed identities invalidates.
 *
 * The unaffected artifacts are reported beside the invalidated ones on purpose.
 * "Only these are stale" is a claim about the complement, and a report that
 * names one side alone cannot be checked.
 *
 * Every list sorts by UTF-16 code unit. A changed id that names no declared
 * subject or derived artifact makes `designLineageImpact` throw rather than be
 * ignored.
 *
 * @evidence contracts/common.md#principled-implementation `designLineageImpact` walks the declared input edges backwards breadth-first from the changed ids, so an artifact is invalidated exactly when it is reachable from a changed identity; the premise is that `inputs` lists every dependency, which validation cannot prove.
 * @evidence contracts/common.md#clear-and-simple-design Three sorted id lists, the question, its reach, and the complement, so a caller checks `invalidated` and `unaffected` partition the derived artifacts without a second query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown changed id throws instead of being dropped, and an invalid lineage throws before the walk, so a typo cannot produce an empty and falsely clean impact.
 * @evidence contracts/common.md#meaningful-documentation States why the complement is reported, the code-unit ordering, deduplication of `changed`, that a changed artifact is itself invalidated, and the error on an unknown id.
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

  /**
   * Derived artifact ids no changed identity reaches through declared inputs,
   * in ascending order; together with {@link invalidated} it lists every
   * derived artifact exactly once.
   */
  unaffected: string[];
}
