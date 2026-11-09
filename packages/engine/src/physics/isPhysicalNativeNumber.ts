/**
 * A finite scalar which remains finite when transferred to Rapier's f32 boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A finite scalar which remains finite when transferred to Rapier's f32 boundary) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (A finite scalar which remains finite when transferred to Rapier's f32 boundary) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `Number.isFinite`, `Math.fround`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `Number.isFinite`, `Math.fround` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function isPhysicalNativeNumber(value: number): boolean {
  return Number.isFinite(value) && Number.isFinite(Math.fround(value));
}
