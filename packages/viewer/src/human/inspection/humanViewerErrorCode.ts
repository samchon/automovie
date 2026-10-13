/**
 * The system error code of a failed request, read from the error or any error
 * in its first eight `cause` nodes (`fetch` wraps the socket error, so `ECONNREFUSED` sits
 * one level down), or null when none carries a code. The module has no
 * imports and uses only syntax Node strips, so the plain-Node control script
 * can load it.
 *
 * @evidence contracts/common.md#principled-implementation Classifies a failure by the operating system's code rather than by message text.
 * @evidence contracts/common.md#clear-and-simple-design One bounded cause traversal returns the first actual string code or an explicit unknown result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads supplied error properties without rewriting failures, parsing localized messages or adopting an unanswered listener as a dead process.
 * @evidence contracts/common.md#meaningful-documentation States where the code is looked for.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Classifies a failure by the operating system's code rather than by message text.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One bounded cause traversal returns the first actual string code or an explicit unknown result.
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
