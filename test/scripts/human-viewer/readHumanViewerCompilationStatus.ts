/**
 * Read the compiler's metadata through an explicit text boundary. Missing or
 * malformed status has no claimed success time. The callback owns persistence;
 * this parser owns the report shape and never inspects source or image bytes.
 *
 * @evidence contracts/common.md#principled-implementation Error and success time remain independent nullable facts, and unreadable metadata does not invent either fact.
 * @evidence contracts/common.md#clear-and-simple-design One text callback separates status admission from filesystem ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the actual report and does not infer compilation success from a rendered frame.
 * @evidence contracts/common.md#meaningful-documentation States metadata-only input, failure meaning and persistence ownership.
 */
export function readHumanViewerCompilationStatus(read: () => string): {
  error: string | null;
  goodAt: string | null;
} {
  try {
    const value = JSON.parse(read()) as { error?: unknown; goodAt?: unknown } | null;
    if (value === null || typeof value !== "object" ||
        !(value.error === null || typeof value.error === "string") ||
        !(value.goodAt === null || typeof value.goodAt === "string"))
      return { error: null, goodAt: null };
    return { error: value.error, goodAt: value.goodAt };
  } catch {
    return { error: null, goodAt: null };
  }
}
