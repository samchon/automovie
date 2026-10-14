

/**
 * Remove an atomic operation's temporary entry while preserving cleanup failures.
 *
 * The caller runs this in its finally path and supplies fenced removal; the temporary string only identifies a diagnostic. A wrapper distinguishes an original thrown undefined from no operation failure. Successful removal returns normally, leaving the caller's pending failure intact.
 *
 * @evidence contracts/common.md#principled-implementation The finally cleanup callback runs once; its failure becomes an AggregateError with the original wrapped cause when present. The writer supplies the actual filesystem operation and namespace fence.
 * @evidence contracts/common.md#clear-and-simple-design A small failure wrapper preserves the distinction between no failure and a thrown undefined without introducing a retry or another filesystem owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup after success is reported as cleanup failure, and cleanup after failure retains both causes; no failure is suppressed or temporary residency inferred from its name.
 * @evidence contracts/common.md#meaningful-documentation States finally-path use, fenced callback ownership and original-value preservation; the caller must inspect committed state after successful publication followed by cleanup failure.
 * @evidence contracts/performance.md#efficient-algorithms The helper performs one removal call and allocates at most a two-element cause array; underlying filesystem work and error-message path length remain part of the operation's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Cleanup concerns this attempt's temporary entry and cannot reuse another operation's successful removal or namespace observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The callback owns removal and any handle release. This helper retains no task or descriptor; a thrown aggregate transfers cause and diagnostic references to the caller, and failed removal can leave temporary bytes resident.
 */
export function cleanupProductionAtomic(
  temporary: string,
  failure: { error: unknown } | undefined,
  remove: () => void
): void {
  try {
    remove();
  } catch (cleanupFailure) {
    throw new AggregateError(
      failure === undefined
        ? [cleanupFailure]
        : [failure.error, cleanupFailure],
      failure === undefined
        ? `Production atomic operation completed, but temporary cleanup failed: ${temporary}. Inspect the committed state before retrying.`
        : `Production atomic cleanup failed after the operation failed: ${temporary}.`,
    );
  }
}
