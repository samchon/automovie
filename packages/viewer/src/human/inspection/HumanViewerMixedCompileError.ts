/**
 * A candidate's browser compile stamps or checked Node source authority disagree.
 * The page marks it for host-owned replacement; a new candidate must pass its
 * own current-source admission and is not guaranteed ready during compilation.
 * This class carries the message and diagnostic name, without scheduling retries.
 *
 *
 * @evidence contracts/common.md#principled-implementation assertHumanViewerSingleCompile constructs this error when browser compile stamps or the checked Node source authority disagree; its constructor preserves the cause message and sets a diagnostic name.
 * @evidence contracts/common.md#clear-and-simple-design Names mixed-source rejection separately from numerical document rejection, allowing the host to request a replacement candidate without embedding a retry scheduler in the error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement is not a guarantee that compilation has settled: every fresh candidate still needs source admission, and this class never accepts mixed modules because time elapsed.
 * @evidence contracts/common.md#meaningful-documentation States the source mismatch, discarded candidate and host-owned replacement; the constructor itself schedules no work and proves no newest-compile or renderer readiness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Calls Error and assigns one name; compile-stamp/source validation and candidate startup remain the guard and host's processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh candidate must obtain its own current source witness; a previous mixed-source refusal is not cached admission for a later candidate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The message and captured Error stack persist only through references to this refusal, with no message-length cap; candidate holds, frames and workers are owned and retired elsewhere.
 *
 * @author Samchon
 */
export class HumanViewerMixedCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerMixedCompileError";
  }
}
