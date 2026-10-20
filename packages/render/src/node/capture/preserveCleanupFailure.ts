import type { IAutoMoviePageOperationFailure } from "./IAutoMoviePageOperationFailure.js";

/**
 * Await one caller-supplied cleanup. A cleanup-only failure is rethrown unchanged; when an earlier operation also failed, AggregateError retains [operation cause, cleanup cause] in that order and identifies the resource. Successful cleanup leaves the caller's original control flow intact.
 *
 *
 *
 * @evidence contracts/common.md#principled-implementation Awaited cleanup preserves a single cleanup failure unchanged and aggregates operation then cleanup causes when both fail.
 * @evidence contracts/common.md#clear-and-simple-design One helper centralizes resource-error ordering for browser, page, session and encoder teardown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thrown undefined remains representable in the wrapper, and neither failure is silently discarded.
 * @evidence contracts/common.md#meaningful-documentation The comment states cause ordering, cleanup-only propagation and successful-cleanup behavior.
 * @evidence contracts/performance.md#efficient-algorithms The helper awaits exactly one cleanup and allocates an AggregateError only when both causes exist, O(1) work.
 * @evidence contracts/performance.md#reuse-equivalent-work Effectful cleanup runs once per call and is never cached or merged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the resource; this helper awaits release and retains its two causes only in the thrown aggregate when release fails.
 */
export const preserveCleanupFailure: (
  failure: IAutoMoviePageOperationFailure | undefined,
  resource: string,
  cleanup: () => unknown,
) => Promise<void> = async (
  failure: IAutoMoviePageOperationFailure | undefined,
  resource: string,
  cleanup: () => unknown,
): Promise<void> => {
  try {
    await cleanup();
  } catch (cleanupError) {
    if (failure === undefined) throw cleanupError;
    throw new AggregateError(
      [failure.error, cleanupError],
      `${resource} cleanup failed after the operation failed.`,
    );
  }
};
