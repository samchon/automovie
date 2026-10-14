/**
 * One line naming an error and up to seven nested causes, so a client's failure says why: `fetch failed` alone hides the socket error that explains it. The module has no imports and uses only syntax Node strips. An unreadable error property or throwing string conversion produces an explicit unprintable marker instead of throwing while reporting the cause.
 *
 * @evidence contracts/common.md#principled-implementation Iterative bounded cause traversal preserves native error names/messages/codes and stops after eight levels; failed property access or coercion is reported explicitly as unprintable.
 * @evidence contracts/common.md#clear-and-simple-design One import-free formatter owns nested error text for plain-Node control and diagnostics without evaluating numerical runtime modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic conversion cannot replace an unknown failure with successful state or throw a new coercion error while attempting to explain the original failure.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the eight-level bound, nested-cause purpose, plain-Node compatibility and unprintable-value fallback.
 * @evidence contracts/performance.md#efficient-algorithms At most eight cause records are inspected; work and output allocation follow their message/code text lengths, and the depth bound also terminates cyclic causes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Error objects and their properties can differ across attempts, so the formatter retains no memoized descriptions or cross-request error state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only transient description strings are accumulated; the formatter acquires no runtime handle and retains no original cause object after returning.
 */
export function describeHumanViewerError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth: number = 0; current !== undefined && depth < 8; ++depth) {
    try {
      if (current instanceof Error) {
        const code: string =
          "code" in current && typeof current.code === "string"
            ? ` [${current.code}]`
            : "";
        parts.push(`${current.name}: ${current.message}${code}`);
        current = current.cause;
      } else {
        parts.push(String(current));
        current = undefined;
      }
    } catch {
      parts.push("Unprintable error");
      break;
    }
  }
  return parts.join(" <- caused by ");
}
