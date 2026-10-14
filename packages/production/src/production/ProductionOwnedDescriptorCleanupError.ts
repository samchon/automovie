

/**
 * Retain ordered read/recheck/close failures as a descriptor cleanup AggregateError.
 *
 * @evidence contracts/common.md#principled-implementation An unchanged named subclass uses native AggregateError cause storage and stack behavior; its helper supplies already captured ordered thrown values.
 * @evidence contracts/common.md#clear-and-simple-design One internal class identity distinguishes this cause chain for its owning helper; it is not a new public root API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native Error.name remains inherited and arbitrary causes stay references rather than string substitutes; construction alone does not certify cleanup succeeded.
 * @evidence contracts/common.md#meaningful-documentation States native aggregation, named class identity and ownership of retained cause references.
 * @evidence contracts/performance.md#efficient-algorithms Native Error/stack construction and cause-array materialization scale with supplied cause count and runtime stack behavior.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses already captured causes without rerunning failed host actions or memoizing Error instances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Catching callers retain the Error and arbitrary cause graphs until release; the class acquires no descriptor or worker.
 */
export class ProductionOwnedDescriptorCleanupError extends AggregateError {
}
