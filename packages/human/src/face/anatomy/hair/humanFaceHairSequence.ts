/**
 * Radical inverse shared by numerical hair roots, length variation and curl. Callers supply a nonnegative safe sequence integer and an integer base above one. Distinct prime bases choose independent coordinates of the same retained sequence identity; no mutable random state or personal geometry participates. Zero maps to zero. The operation reads scalar inputs and returns a scalar.
 *
 * @evidence contracts/common.md#principled-implementation Digit reversal in an integer base supplies retained deterministic radical-inverse coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Root sampling, guide selection, variation, gather spread and curl read distinct bases of one sequence identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonnegative safe index and base greater than one are caller premises; this helper does not validate malformed direct inputs.
 * @evidence contracts/common.md#meaningful-documentation Zero maps to zero and no mutable random state participates.
 * @evidence contracts/performance.md#efficient-algorithms Work follows the logarithmic number of base digits in the index, with constant storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All numerical-hair consumers share the same sequence arithmetic rather than private RNG state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local scalar parameters are reduced and no sequence table/cache persists.
 */
export function humanFaceHairSequence(index: number, base: number): number {
  let inverse: number = 1 / base,
    result: number = 0;
  while (index > 0) {
    result += (index % base) * inverse;
    index = Math.floor(index / base);
    inverse /= base;
  }
  return result;
}
