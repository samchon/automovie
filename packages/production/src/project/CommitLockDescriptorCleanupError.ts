

/**
 * AggregateError subtype preserving ordered read and descriptor-close causes. Its constructor is inherited; callers must inspect errors rather than treating a close failure as proof the descriptor was released.
 *
 * @evidence contracts/common.md#principled-implementation Uses the language AggregateError representation so an earlier read cause and subsequent native close failures remain inspectable in order.
 * @evidence contracts/common.md#clear-and-simple-design One subtype lets nested descriptor cleanup flatten an already composed cause list without replacing the original read failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No synthetic close success, swallowed cause or foreign method patch is used; throwing the aggregate does not establish native handle completion.
 * @evidence contracts/common.md#meaningful-documentation Documents inherited construction, ordered errors and the unresolved descriptor state after failed close.
 * @evidence contracts/performance.md#efficient-algorithms Inherited AggregateError construction copies the supplied E error entries and retains their references; message storage follows its length.
 * @evidence contracts/performance.md#reuse-equivalent-work The close helper recognizes an existing cleanup aggregate to reuse original error objects rather than wrap the aggregate as an opaque first cause.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retaining this error retains its causes; the subtype owns no descriptor and supplies no independent cleanup retry.
 */
export class CommitLockDescriptorCleanupError extends AggregateError {}
