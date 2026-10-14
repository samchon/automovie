/**
 * Select compilation authority without treating an old display failure as a current compiler error. Candidate recovery must be allowed before its ready event clears display diagnostics. The legacy health field remains supported while a resident server is being upgraded to the separate compilation report. Missing or malformed source authority refuses rather than implying success.
 *
 * @evidence contracts/common.md#principled-implementation Unknown health JSON must provide a string-or-null compilation cause when that report exists, otherwise the legacy sourceError cause; incompatible shapes throw before publication.
 * @evidence contracts/common.md#clear-and-simple-design One shared boundary owns modern-versus-legacy source authority and keeps retained-display diagnostics out of the modern compilation result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent/null malformed report is not accepted as successful compilation, and an older display error does not block recovery when current compilation authority is explicitly healthy.
 * @evidence contracts/common.md#meaningful-documentation The prose documents modern compilation precedence, legacy support and malformed-envelope refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed number of structural field checks selects no collection traversal or error-history search algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compilation authority is checked from this health snapshot without memoizing nullable causes across source changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selector borrows parsed health data and returns only its cause string/null, retaining no transport or generation resources.
 */
export function humanViewerCandidateSourceError(
  health: unknown,
): string | null {
  if (health === null || typeof health !== "object" || Array.isArray(health))
    throw new Error("The viewer health has no source authority");
  if ("compilation" in health && health.compilation !== undefined) {
    const compilation: unknown = health.compilation;
    if (
      compilation !== null &&
      typeof compilation === "object" &&
      !Array.isArray(compilation) &&
      "error" in compilation &&
      (compilation.error === null || typeof compilation.error === "string")
    )
      return compilation.error;
    throw new Error("The viewer health has an incompatible compilation report");
  }
  if (
    "sourceError" in health &&
    (health.sourceError === null || typeof health.sourceError === "string")
  )
    return health.sourceError;
  throw new Error("The viewer health has no legacy source authority");
}
