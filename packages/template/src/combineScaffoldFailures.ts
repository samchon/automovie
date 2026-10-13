/** The failures of one scaffold operation, in the order they happened. */
class ScaffoldCleanupError extends AggregateError {}

/**
 * Combine an operation's earlier failure with the failure of a cleanup step that ran because of it, so a close error never hides the error that caused the close.
 *
 * `first` is `undefined` when the operation had not failed; `second` is then returned unchanged. Otherwise the result is one `AggregateError` listing `first` before `second`, and a `first` that this function built is spread into the new list, so repeated cleanups yield one flat list in failure order. Any other `AggregateError` stays a single member, keeping its own message.
 *
 * @param first Failure observed before the cleanup, or `undefined` for none.
 * @param second Failure of the cleanup step.
 * @param resource Name of the released resource, used in the message.
 * @returns `second` alone, or the combined failure.
 *
 * @evidence contracts/common.md#principled-implementation `AggregateError` is the standard container for several errors, and a private subclass marks the lists built here so only those are flattened; the premise is that no caller throws `undefined` as a real failure, which holds because every caller stores caught errors from Node or from this package, and both throw `Error` objects.
 * @evidence contracts/common.md#clear-and-simple-design publishNativeScaffoldFile and overwriteScaffoldFile share cleanup-error ordering and flattening here; the private aggregate subtype keeps the combination marker out of the public API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is swallowed or retried: both failures reach the caller, and the function only decides their container.
 * @evidence contracts/common.md#meaningful-documentation The comment states what `undefined` means for `first`, the order of members, which aggregates are flattened, and what `resource` names.
 * @evidence contracts/performance.md#efficient-algorithms Building the list copies the members of an earlier combination once, linear in the failures of one operation, which is at most a few close steps.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call wraps two distinct failures of one operation; there is no result another call could share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned aggregate holds references to the combined failures only for as long as the caller keeps it; the function owns no handle or other state.
 */
export const combineScaffoldFailures: (first: unknown, second: unknown, resource: string) => unknown = (
  first: unknown,
  second: unknown,
  resource: string,
): unknown =>
  first === undefined
    ? second
    : new ScaffoldCleanupError(
        [
          ...(first instanceof ScaffoldCleanupError ? first.errors : [first]),
          second,
        ],
        `${resource} failed after an earlier scaffold failure`,
      );
