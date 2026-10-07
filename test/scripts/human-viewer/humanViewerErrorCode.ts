/**
 * The system error code of a failed request, read from the error or any error
 * in its `cause` chain (`fetch` wraps the socket error, so `ECONNREFUSED` sits
 * one level down), or null when none carries a code. The module has no
 * imports and uses only syntax Node strips, so the plain-Node control script
 * can load it.
 *
 * @evidence contracts/common.md#principled-implementation Classifies a failure by the operating system's code rather than by message text.
 * @evidence contracts/common.md#meaningful-documentation States where the code is looked for.
 */
export function humanViewerErrorCode(error: unknown): string | null {
  for (let current: unknown = error, depth = 0; depth < 8; ++depth) {
    if (typeof current !== "object" || current === null) return null;
    if ("code" in current && typeof current.code === "string")
      return current.code;
    if (!("cause" in current)) return null;
    current = current.cause;
  }
  return null;
}
