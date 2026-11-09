/**
 * Run one Rapier enumeration whose JavaScript visitor may throw.
 *
 * Rapier 0.21's wasm-bindgen glue catches an exception raised by a visitor
 * passed to a native enumeration (`contactPairsWith`, `contactPair`,
 * `intersectionPairsWith`) and hands it back to Rust, which does not propagate
 * it. A refused native transfer, a nonfinite impulse or a malformed receipt
 * would otherwise vanish while the enumeration and the step continue. The
 * first failure stops every later visit of this enumeration and is rethrown
 * once the native call has returned. Nested enumerations each use their own
 * call, so an inner failure surfaces through the outer visitor as well.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Run one Rapier enumeration whose JavaScript visitor may throw) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Run one Rapier enumeration whose JavaScript visitor may throw) directly over its typed inputs (`enumerate`, `visit`) as a fixed number of statements with no loop or recursion in the body, delegating to `enumerate`, `visit`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 12 lines and 3 top-level statements that reuses `enumerate`, `visit` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `enumerate`, `visit`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function visitPhysicalNative<Arguments extends unknown[]>(
  enumerate: (visitor: (...values: Arguments) => void) => void,
  visit: (...values: Arguments) => void,
): void {
  let failure: { error: unknown } | undefined;
  enumerate((...values: Arguments): void => {
    if (failure) return;
    try {
      visit(...values);
    } catch (error) {
      failure = { error };
    }
  });
  if (failure) throw failure.error;
}
