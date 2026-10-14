/**
 * Identifies failed or backward injected clock observations so terminal fallback can preserve the last valid instant rather than reopen elapsed budget.
 *
 * @evidence contracts/common.md#principled-implementation Identifies failed or backward injected clock observations so terminal fallback can preserve the last valid instant rather than reopen elapsed budget.
 * @evidence contracts/common.md#clear-and-simple-design One shared internal Error identity connects clock observation with terminal fallback classification across the split files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation It retains only Error metadata and is caught/classified by the execution boundary; it creates no timer or provider task.
 * @evidence contracts/performance.md#efficient-algorithms The shared internal Error subtype keeps instanceof identity across executor helpers; construction has ordinary Error allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It retains only Error metadata and is caught/classified by the execution boundary; it creates no timer or provider task.
 */
export class AutoMovieRepaintClockError extends Error {}
