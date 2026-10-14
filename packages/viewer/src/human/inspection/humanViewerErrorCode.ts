/**
 * The system error code of a failed request, read from the error or any error in its first eight `cause` nodes (`fetch` wraps the socket error, so `ECONNREFUSED` sits one level down), or null when none carries a code. The module has no imports and uses only syntax Node strips, so the plain-Node control script can load it.
 *
 * @evidence contracts/common.md#principled-implementation Up to eight actual cause nodes are inspected for a string code, matching wrapped fetch socket errors without recursive traversal.
 * @evidence contracts/common.md#clear-and-simple-design One bounded loop follows the cause chain and returns the first available code or null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, cyclic or unreadable cause/code properties do not invent a system error code; property-access refusal returns null instead of replacing the original failure.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the eight-node limit, wrapped socket purpose and plain-Node runtime compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms At most eight property inspections form a fixed bounded diagnostic projection rather than an input-sized graph algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each error chain is inspected independently and no previous socket diagnosis is cached as its code.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One current cause reference and depth counter bound traversal; the helper retains no error chain after returning and cycles stop at eight nodes.
 */
export function humanViewerErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth: number = 0; depth < 8; ++depth) {
    if (typeof current !== "object" || current === null) return null;
    try {
      const code: unknown = "code" in current ? current.code : undefined;
      if (typeof code === "string") return code;
      if (!("cause" in current)) return null;
      current = current.cause;
    } catch {
      return null;
    }
  }
  return null;
}
