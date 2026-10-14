/**
 * Waits the requested milliseconds with a host timer and once-only abort listener, refusing immediately when already aborted.
 *
 * @evidence contracts/common.md#principled-implementation Waits the requested milliseconds with a host timer and once-only abort listener, refusing immediately when already aborted.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Completion/abort removes the listener and abort clears the timer; the returned Promise owns only that wait boundary.
 * @evidence contracts/performance.md#efficient-algorithms The executor supplies host-safe delays and independently proves full clock elapsed time before retry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Completion/abort removes the listener and abort clears the timer; the returned Promise owns only that wait boundary.
 */
export const productionRepaintServiceWaitForRepaintBackoff: (milliseconds: number, signal: AbortSignal) => Promise<void> = (
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> =>
  new Promise((resolve: () => void, reject: (reason?: unknown) => void): void => {
    let settled: boolean = false;
    const abort: () => void = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new Error("Repaint request was cancelled during backoff."));
    };
    const timer: NodeJS.Timeout = setTimeout((): void => {
      settled = true;
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
