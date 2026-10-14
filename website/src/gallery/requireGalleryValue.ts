/**
 * Return an observed authored markup value unchanged, or throw the missing selector when it is null, before enhancement listeners attach.
 *
 * @evidence contracts/common.md#principled-implementation Native querySelector absence is represented by null, so an exact null guard preserves present node identity without truthiness coercion.
 * @evidence contracts/common.md#clear-and-simple-design One admission helper is shared by article reading and modal-element lookup while their DOM selection responsibilities remain local.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing markup is refused rather than synthesized or selected from a fallback fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment states unchanged value identity, null meaning and the selector-bearing failure.
 * @evidence contracts/performance.md#efficient-algorithms Success costs constant time and storage; failure message construction costs O(S) in selector length.
 * @evidence contracts/performance.md#reuse-equivalent-work The already observed value is returned without another DOM search or a retained selector cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper acquires no listeners or resources; its caller owns the returned node reference.
 */
export function requireGalleryValue<T>(value: T | null, selector: string): T {
  if (value === null) throw new Error(`Missing gallery element: ${selector}`);
  return value;
}
