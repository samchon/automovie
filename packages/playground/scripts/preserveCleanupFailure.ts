import type { IAutoMoviePlaygroundOperationFailure } from "./IAutoMoviePlaygroundOperationFailure";
/**
 * Await one caller-supplied cleanup. A cleanup-only failure is rethrown unchanged; when an earlier operation also failed, AggregateError retains [operation cause, cleanup cause] in that order and identifies the resource. Successful cleanup leaves the caller's original control flow intact.
 *
 * @evidence contracts/common.md#principled-implementation The original cause is preserved without guessing its type, while aggregate failure exposes both independently meaningful causes.
 * @evidence contracts/common.md#clear-and-simple-design The callback is the only release operation; the caller owns acquisition, cleanup ordering and propagation of the earlier error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cleanup failure is swallowed or replaced by a synthetic success. This helper does not prove physical resource release after a failed cleanup.
 * @evidence contracts/common.md#meaningful-documentation Specifies cleanup-only rethrow, ordered aggregate causes, caller acquisition/flow ownership and the absence of physical-release proof after cleanup failure.
 * @evidence contracts/performance.md#efficient-algorithms Local work is one callback await plus at most one two-cause AggregateError; the callback retains its actual arbitrary release cost.
 * @evidence contracts/performance.md#reuse-equivalent-work An earlier cause is borrowed directly; cleanup is invoked once per helper call and no retry/cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pending invocation retains the callback, failure and resource label until actual cleanup settlement, without a timeout or cancellation. It acquires no handle and retains no result cache; nested caller finally blocks remain responsible for independently attempting outer releases after rejection.
 *
 * @author Samchon
 */
export const preserveCleanupFailure: (failure: IAutoMoviePlaygroundOperationFailure | undefined, resource: string, cleanup: () => unknown) => Promise<void> = async (
  failure: IAutoMoviePlaygroundOperationFailure | undefined,
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
