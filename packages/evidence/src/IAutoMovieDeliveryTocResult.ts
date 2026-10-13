

/**
 * Canonical delivery index bytes and their read-only freshness result.
 *
 * @evidence contracts/common.md#principled-implementation Canonical source bytes, exact changed state and freshness diagnostics represent one pure TOC planning result.
 * @evidence contracts/common.md#clear-and-simple-design One result supports check and generation consumers without a separate renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The changed flag is byte comparison, not a semantic prose or render judgment.
 * @evidence contracts/common.md#meaningful-documentation The planner freezes the result and diagnostics array; source is emitted in both modes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; planAutoMovieDeliveryToc builds and freezes its result for the delivery owner, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; planAutoMovieDeliveryToc builds and freezes its result for the delivery owner, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; planAutoMovieDeliveryToc builds and freezes its result for the delivery owner, while the caller or module owns the lifetime of its values.
 */
export interface IAutoMovieDeliveryTocResult {
  /** Whether the supplied index differs from the canonical rendered bytes. */
  changed: boolean;

  /** Read-only freshness diagnostics; empty when the index is current. */
  diagnostics: readonly string[];

  /** Canonical index bytes in both generation and check modes. */
  source: string;
}
