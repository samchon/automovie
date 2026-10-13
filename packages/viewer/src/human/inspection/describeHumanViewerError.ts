/**
 * One line naming an error and up to seven nested causes, so a client's failure
 * says why: `fetch failed` alone hides the socket error that explains it.
 * The module has no imports and uses only syntax Node strips.
 *
 * @evidence contracts/common.md#principled-implementation Reports up to eight actual error-chain nodes, including system codes, rather than hiding the socket cause behind its outer fetch wrapper.
 * @evidence contracts/common.md#clear-and-simple-design One iterative bounded formatter reads message, code and cause without another error classification policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves caller error text and codes without guessing a cause from a subject name or rewriting a foreign Error instance.
 * @evidence contracts/common.md#meaningful-documentation States what the line contains.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Reports up to eight actual error-chain nodes, including system codes, rather than hiding the socket cause behind its outer fetch wrapper.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform One iterative bounded formatter reads message, code and cause without another error classification policy.
 */
export function describeHumanViewerError(error: unknown): string {
  const parts: string[] = [];
  for (
    let current: unknown = error, depth = 0;
    current !== undefined && depth < 8;
    ++depth
  ) {
    if (current instanceof Error) {
      const code =
        "code" in current && typeof current.code === "string"
          ? ` [${current.code}]`
          : "";
      parts.push(`${current.name}: ${current.message}${code}`);
      current = current.cause;
    } else {
      parts.push(String(current));
      current = undefined;
    }
  }
  return parts.join(" <- caused by ");
}
