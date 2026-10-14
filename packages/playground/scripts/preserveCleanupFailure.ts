import type { IAutoMoviePlaygroundOperationFailure } from "./IAutoMoviePlaygroundOperationFailure";
/**
 * Await one caller-supplied cleanup. A cleanup-only failure is rethrown unchanged; when an earlier operation also failed, AggregateError retains [operation cause, cleanup cause] in that order and identifies the resource. Successful cleanup leaves the caller's original control flow intact.
 *
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
