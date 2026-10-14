

/**
 * A presence envelope retaining an arbitrary read or recheck failure before descriptor cleanup.
 *
 * @evidence contracts/common.md#principled-implementation Undefined envelope differs from a present undefined thrown value, allowing close handling to preserve earlier failures.
 * @evidence contracts/common.md#clear-and-simple-design One error field links the owned reader's catch/finally scopes to closeProductionOwnedDescriptor without interpreting or converting the captured value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation The error member retains the original thrown value, including undefined; only absence of the enclosing record means no earlier read/recheck failure was captured.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The owned read holds this cause until finally close/propagation; the type acquires no descriptor.
 * @author Samchon
 */
export interface IProductionOwnedDescriptorFailure {
    /** Original read/recheck failure passed to descriptor close handling. */
    error: unknown;
}
