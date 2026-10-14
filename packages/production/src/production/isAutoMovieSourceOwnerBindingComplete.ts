import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";

/**
 * Require an enforced source-owner edge at a completed evidence/review stage.
 *
 * @evidence contracts/common.md#principled-implementation The closed stage comparison and enforced flag are declaration completion, not a semantic review verdict; owner address, source bytes and physical observations are authenticated separately.
 * @evidence contracts/common.md#clear-and-simple-design Execution, attribution and library source planning share this one declaration-completion predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Removed prose review flags and lexical fingerprints supply no authority; this predicate cannot certify runtime success or visual evidence.
 * @evidence contracts/common.md#meaningful-documentation States enforced/stage meaning and separate current-byte/owner verification.
 * @evidence contracts/performance.md#efficient-algorithms Two scalar comparisons take constant work without source or document inspection.
 * @evidence contracts/performance.md#reuse-equivalent-work The current edge is judged directly; no completed result is cached across stage edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate returns a boolean and retains no binding, handle or task.
 */
export function isAutoMovieSourceOwnerBindingComplete(
  binding: IAutoMovieProductionEvidenceSourceOwnerBinding,
): boolean {
  return binding.enforced &&
  (binding.stage === "evidence" || binding.stage === "review");
}
