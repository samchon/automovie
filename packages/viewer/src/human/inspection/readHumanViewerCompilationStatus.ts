/**
 * Read the compiler's metadata through an explicit text boundary. Missing or malformed status has no claimed success time. Only the current process and its OS creation identity own a report; an earlier server's failure and last success remain unclaimed by its replacement. The callback owns persistence; this parser owns the report shape and never inspects source or image bytes.
 *
 * @evidence contracts/common.md#principled-implementation Only reports matching the current PID and OS creation stamp with valid error/goodAt fields contribute compilation metadata.
 * @evidence contracts/common.md#clear-and-simple-design One guarded text parser keeps persistence and compiler/source inspection outside this status projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/malformed/stale-owner status yields no claimed success time rather than adopting another process's report.
 * @evidence contracts/common.md#meaningful-documentation The comment separates parser shape authority, current-process identity and callback-owned persistence.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing scans status text once followed by fixed ownership/field checks.
 * @evidence contracts/performance.md#reuse-equivalent-work No earlier owner's metadata is cached as current; each read must satisfy the supplied current process identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two returned nullable strings survive and no source bytes, PNG data or file descriptor are retained.
 */
export function readHumanViewerCompilationStatus(
  read: () => string,
  owner: { pid: number; processStartedAt: string },
): {
  error: string | null;
  goodAt: string | null;
} {
  try {
    const value: {
      error?: unknown;
      goodAt?: unknown;
      pid?: unknown;
      processStartedAt?: unknown;
    } | null = JSON.parse(read()) as {
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
