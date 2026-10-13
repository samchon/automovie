/**
 * Read the compiler's metadata through an explicit text boundary. Missing or
 * malformed status has no claimed success time. Only the current process and
 * its OS creation identity own a report; an earlier server's failure and last
 * success remain unclaimed by its replacement. The callback owns persistence;
 * this parser owns the report shape and never inspects source or image bytes.
 */
export function readHumanViewerCompilationStatus(
  read: () => string,
  owner: { pid: number; processStartedAt: string },
): {
  error: string | null;
  goodAt: string | null;
} {
  try {
    const value = JSON.parse(read()) as {
      error?: unknown;
      goodAt?: unknown;
      pid?: unknown;
      processStartedAt?: unknown;
    } | null;
    if (
      value === null ||
      typeof value !== "object" ||
      value.pid !== owner.pid ||
      value.processStartedAt !== owner.processStartedAt ||
      !(value.error === null || typeof value.error === "string") ||
      !(value.goodAt === null || typeof value.goodAt === "string")
    )
      return { error: null, goodAt: null };
    return { error: value.error, goodAt: value.goodAt };
  } catch {
    return { error: null, goodAt: null };
  }
}
