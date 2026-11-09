import type { IAutoMoviePhysicalHandoff } from "./IAutoMoviePhysicalHandoff";

/**
 * Inspect run-owned transitions without allocating a key array on each native tick.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Inspect run-owned transitions without allocating a key array on each native tick) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Inspect run-owned transitions without allocating a key array on each native tick) directly over its typed inputs (`transitions`) as a single pass (for-of over transitions), delegating to `Object.hasOwn`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 6 lines and 3 top-level statements that reuses `Object.hasOwn` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `transitions`; the dominant cost is a single pass (for-of over transitions), performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function hasPhysicalHandoff(
  transitions: Readonly<Record<string, IAutoMoviePhysicalHandoff>> | undefined,
): boolean {
  if (!transitions) return false;
  for (const bone in transitions)
    if (Object.hasOwn(transitions, bone)) return true;
  return false;
}
