/**
 * Radical inverse shared by numerical hair roots, length variation and curl.
 * Callers supply a nonnegative safe sequence integer and an integer base above
 * one. Distinct prime bases choose independent coordinates of the same retained
 * sequence identity; no mutable random state or personal geometry participates.
 * Zero maps to zero. The operation reads scalar inputs and returns a scalar.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Replays personal scalar variation independently of discarded root candidates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Gives root sampling and styling one stable sequence identity.
 */
export function humanFaceHairSequence(index: number, base: number): number {
  let inverse = 1 / base,
    result = 0;
  while (index > 0) {
    result += (index % base) * inverse;
    index = Math.floor(index / base);
    inverse /= base;
  }
  return result;
}
