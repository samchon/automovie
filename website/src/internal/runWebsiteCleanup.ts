/**
 * Attempt each supplied synchronous cleanup in order, including after a failure. The caller retires callback authority before invoking this function and owns any asynchronous work; returning means every supplied callback returned, not that native resource release was observed.
 *
 * Existing failure values precede cleanup failures. A single failure is thrown unchanged; multiple failures retain their values and attempt order in AggregateError.errors. Coordination work and temporary retention are O(C + F) for C callbacks and F reported failures, plus the original callbacks' work and retained payloads; this function adds no retry, cross-owner cache or state after the call.
 *
 * @evidence contracts/common.md#principled-implementation Sequential try/catch attempts every synchronous cleanup and appends arbitrary thrown values after prior failures, preserving a lone failure identity and aggregate attempt order.
 * @evidence contracts/common.md#clear-and-simple-design Callers own retirement and once-only authority; this shared boundary only coordinates independent cleanup attempts and cause reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed cleanup does not stop later owners or trigger retries; callback returns are not represented as proof of native resource release.
 * @evidence contracts/common.md#meaningful-documentation The comment states synchronous ownership, ordered error identity, resource-observation limits and the absence of retry state.
 * @evidence contracts/performance.md#efficient-algorithms Coordination costs O(C + F) time and temporary failure storage, in addition to C callback bodies; a full attempt pass is required to avoid skipping owners after a failure.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied cleanup effects are invoked individually rather than deduplicated by result; caller-owned state prevents repeated ownership release.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state is retained after return or throw except errors retained by the caller; arbitrary callback captures and failure bytes have no imposed size cap.
 */
export function runWebsiteCleanup(
  callbacks: readonly (() => void)[],
  priorFailures: readonly unknown[] = [],
): void {
  const failures: unknown[] = [...priorFailures];
  for (const callback of callbacks) {
    try {
      callback();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "Website cleanup failed.");
}
