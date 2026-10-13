/**
 * The document one step from the current one in a list, wrapping at both ends. A current document that is not in the list gives the first (or, when stepping back, the last) so the previous and next buttons always move. An empty list refuses. If ids repeat, the first matching occurrence is the current position; callers normally supply the catalogue's ordered address ids.
 *
 * @evidence contracts/common.md#principled-implementation First-occurrence lookup plus modulo n implements forward/backward cyclic navigation, with direction-specific edge fallback when the current id is absent and explicit empty-list refusal.
 * @evidence contracts/common.md#clear-and-simple-design One pure id-list helper serves both navigation buttons without owning catalogue discovery or display state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result follows supplied list order rather than named-document exceptions, and an empty catalogue receives no invented fallback address.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies wrap, absent-current fallback, empty refusal and repeated-id first-occurrence semantics.
 * @evidence contracts/performance.md#efficient-algorithms indexOf scans n ids once and modulo performs constant scalar work; no array copy or retained index is needed for one adjacent navigation query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Navigation is a current list query and owns no cross-catalogue cached position or numerical result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only one existing id string escapes and this helper acquires no listener, frame or native handle.
 */
export function neighbourHumanViewerDocument(
  ids: readonly string[],
  current: string,
  step: 1 | -1,
): string {
  if (ids.length === 0) throw new Error("There is no document to step through");
  const index: number = ids.indexOf(current);
  if (index < 0) return step === 1 ? ids[0]! : ids[ids.length - 1]!;
  return ids[(index + step + ids.length) % ids.length]!;
}
