import type { NarrativeScope } from "./NarrativeScope";

/**
 * Returns whether the selected narrative population is one pilot slice.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The discriminant comparison recognizes the pilot arm of NarrativeScope without consulting filenames or enabling stages.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This predicate only answers scope selection; file-name validation remains with the narrative selector.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both admitted scope modes use their literal contract spelling, without a special consumer or fallback mode.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies the result as pilot population selection; it makes no approval or layout validity claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms One literal comparison takes constant time and allocates no collection.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure predicate coordinates no reusable requests, phases or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The predicate retains no object, handle or task beyond its call.
 */
export function isFirstPartPilot(scope: NarrativeScope): boolean {
  return scope.mode === "first-part-pilot";
}
