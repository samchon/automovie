/**
 * One line naming an error and every cause beneath it, so a client's failure
 * says why: `fetch failed` alone hides the socket error that explains it.
 * The module has no imports and uses only syntax Node strips.
 *
 * @evidence contracts/common.md#principled-implementation Reports the whole cause chain instead of the outermost wrapper.
 * @evidence contracts/common.md#meaningful-documentation States what the line contains.
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
