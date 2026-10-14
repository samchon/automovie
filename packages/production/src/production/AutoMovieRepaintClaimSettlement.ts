

/**
 * Claim settlement after the adapter boundary: fulfilled or rejected records a known result, while unknown-outcome prevents an automatic replacement attempt. This claim state is separate from media validity and final candidate selection.
 *
 * @evidence contracts/common.md#principled-implementation The closed settlement vocabulary preserves whether the external effect has a known terminal outcome before any future claim takeover.
 * @evidence contracts/common.md#clear-and-simple-design Effect settlement stays separate from output retention, attempt classification and reviewed candidate publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown-outcome is not converted to rejected merely to enable retry, and fulfilled does not imply valid media or selected delivery.
 * @evidence contracts/common.md#meaningful-documentation Prose gives takeover meaning and separates adapter settlement from output/delivery admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union executes no timeout, provider or ledger-processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This vocabulary establishes no equivalence between effectful provider calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased union acquires no task, timer or persisted claim; execution and project storage own those resources.
 * @author Samchon
 */
export type AutoMovieRepaintClaimSettlement =
  | "fulfilled"
  | "rejected"
  | "unknown-outcome";
