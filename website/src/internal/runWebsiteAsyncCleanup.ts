/**
 * Invoke the supplied cleanups in order and await every returned promise independently. Manor page teardown uses this boundary because its texture cache returns a promise while navigation, controls and renderer cleanup are synchronous. A throwing callback does not prevent later callbacks from starting.
 *
 * Prior failure values precede cleanup failures. A single failure keeps its identity; multiple failures preserve callback order in AggregateError.errors. The operation holds O(C + F) callback settlements and failure values until C callbacks settle, with no retry or timeout. The caller owns once-only authority and native release observations; a callback that never settles keeps this operation pending.
 *
 * @evidence contracts/common.md#principled-implementation Mapping invokes each cleanup in array order, then allSettled awaits their concurrently pending results and reports rejection values in callback order after prior failures.
 * @evidence contracts/common.md#clear-and-simple-design This async counterpart serves manor texture teardown while callers retain ownership of once-only disposal and resource acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One rejection does not suppress later callbacks, cause retries or become a claim of native release; a nonsettling callback is not hidden by a timeout.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes invocation order from concurrent settlement, preserves failure identity and identifies the unbounded pending duration.
 * @evidence contracts/performance.md#efficient-algorithms Coordination uses O(C + F) time and settlement/failure references in callback and prior-failure counts, plus callback work; independent cleanups are started without serially awaiting each one.
 * @evidence contracts/performance.md#reuse-equivalent-work Effects are invoked once for this supplied collection and never cached across owners; the manor host shares only its already-started stop promise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Callback promises and captured references remain until all settle; no timeout bounds task duration or captured bytes, and completed coordination retains no private state beyond caller-owned error values.
 */
export async function runWebsiteAsyncCleanup(
  callbacks: readonly ((() => void) | (() => Promise<void>))[],
  priorFailures: readonly unknown[] = [],
): Promise<void> {
  const settled: PromiseSettledResult<undefined>[] = await Promise.allSettled(
    callbacks.map(async (callback: (() => void) | (() => Promise<void>)): Promise<undefined> => {
      await callback();
      return undefined;
    }),
  );
  const failures: unknown[] = [...priorFailures];
  for (const result of settled)
    if (result.status === "rejected") failures.push(result.reason);
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Website cleanup failed.");
}
