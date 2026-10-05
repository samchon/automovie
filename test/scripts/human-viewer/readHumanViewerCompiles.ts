/**
 * The compile generations whose human modules this realm has run, as the
 * stamped modules recorded them.
 *
 * @evidence contracts/common.md#meaningful-documentation States the source of the answer.
 */
export function readHumanViewerCompiles(): string[] {
  return [...((globalThis as { __humanViewerCompiles?: Set<string> }).__humanViewerCompiles ?? [])];
}
