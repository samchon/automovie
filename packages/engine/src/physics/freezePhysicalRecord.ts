/**
 * Freeze an admitted physical input/state tree without copying it again.
 * Shared records are visited once, and typed snapshot byte buffers are left
 * to their Map owner because JavaScript cannot freeze nonempty typed arrays.
 * Trees have the fixed profile/frame schema depth; this is not a JSON parser.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Freeze an admitted physical input/state tree without copying it again) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Freeze an admitted physical input/state tree without copying it again) directly over its typed inputs (`value`) as recursive, so its cost follows the recursion depth the input structure allows, delegating to `Object.isFrozen`, `ArrayBuffer.isView`, `Object.values`, `Object.freeze`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 4 top-level statements that reuses `Object.isFrozen`, `ArrayBuffer.isView`, `Object.values`, `Object.freeze` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is recursive, so its cost follows the recursion depth the input structure allows, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function freezePhysicalRecord(value: object): void {
  if (Object.isFrozen(value) || ArrayBuffer.isView(value)) return;
  const children: unknown[] = Object.values(value);
  for (const child of children)
    if (child !== null && typeof child === "object")
      freezePhysicalRecord(child);
  Object.freeze(value);
}
