/**
 * What one set of changed identities invalidates.
 *
 * The unaffected artifacts are reported beside the invalidated ones on purpose.
 * "Only these are stale" is a claim about the complement, and a report that
 * names one side alone cannot be checked.
 */
export interface IAutoMovieDesignImpact {
  /** Identities the question was asked about, in ascending order. */
  changed: string[];

  /** Derived artifact ids that must be recomputed, in ascending order. */
  invalidated: string[];

  /** Derived artifact ids provably unaffected, in ascending order. */
  unaffected: string[];
}
