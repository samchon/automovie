/**
 * One human module as a compile generation transformed it, with the identity of that generation.
 *
 * @evidence contracts/common.md#principled-implementation Pairs one transformed Human module with the completion-time/sequence identity of the generation that produced it.
 * @evidence contracts/common.md#clear-and-simple-design Keeps module bytes and their actual compile label together for browser/worker compatibility checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A compile label is not current source digest authority; stale last-good fallback remains identifiable and cross-generation incompatibility can refuse.
 * @evidence contracts/common.md#meaningful-documentation Documents transformed code and producing generation identity rather than implying every source request served the latest attempt.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Returning one module uses file-map lookup; actual transformation and dependency scanning belong to its compile owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Same-epoch lookups share generation work and weak labels; a failed newer lookup may explicitly reuse the labeled last-good map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains code/label strings as needed; weak generation labels do not independently retain older file maps or compiler processes.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledSource {
  /** The transformed TypeScript. */
  code: string;

  /** Identity of the compile generation that produced it. */
  compile: string;
}
