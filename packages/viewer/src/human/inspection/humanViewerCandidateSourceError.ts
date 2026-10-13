/**
 * Select compilation authority without treating an old display failure as a
 * current compiler error. Candidate recovery must be allowed before its ready
 * event clears display diagnostics. The legacy health field remains supported
 * while a resident server is being upgraded to the separate compilation report.
 *
 * @evidence contracts/common.md#principled-implementation The compiler report owns source admission independently of display failures retained until the next successful frame.
 * @evidence contracts/common.md#clear-and-simple-design One selector owns the health-protocol transition between legacy and explicit compilation status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fallback handles the existing resident health protocol rather than hiding a current compiler error.
 * @evidence contracts/common.md#meaningful-documentation Explains why recovery precedes clearing old display diagnostics and when the legacy field is used.
 */
export function humanViewerCandidateSourceError(health: {
  compilation?: { error: string | null };
  sourceError: string | null;
}): string | null {
  return health.compilation === undefined
    ? health.sourceError
    : health.compilation.error;
}
