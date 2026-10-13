/**
 * Select compilation authority without treating an old display failure as a
 * current compiler error. Candidate recovery must be allowed before its ready
 * event clears display diagnostics. The legacy health field remains supported
 * while a resident server is being upgraded to the separate compilation report.
 */
export function humanViewerCandidateSourceError(health: {
  compilation?: { error: string | null };
  sourceError: string | null;
}): string | null {
  return health.compilation === undefined
    ? health.sourceError
    : health.compilation.error;
}
