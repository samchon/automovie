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
