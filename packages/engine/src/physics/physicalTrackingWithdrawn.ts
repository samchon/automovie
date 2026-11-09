/**
 * Whether a body's default tracking is withdrawn at one tick.
 *
 * Tracking is withdrawn only when the effective body strength is zero and no
 * explicit per-joint protective strength stays positive; an explicit joint
 * keeps its own motor and therefore keeps the body under tracking.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Whether a body's default tracking is withdrawn at one tick) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Whether a body's default tracking is withdrawn at one tick) directly over its typed inputs (`target`) as a single pass (some over Object.values(target.jointStrength ?? {}), delegating to `Object.values(target.jointStrength ?? {}).some`, `Object.values`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 1 top-level statements that reuses `Object.values(target.jointStrength ?? {}).some`, `Object.values` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `target`; the dominant cost is a single pass (some over Object.values(target.jointStrength ?? {}), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function physicalTrackingWithdrawn(target: {
  /** Effective body tracking fraction: authored strength times balance root strength. */ strength: number;
  /** Explicit per-joint fractions declared by the target. */ jointStrength?: Readonly<
    Record<string, number>
  >;
}): boolean {
  return (
    target.strength === 0 &&
    !Object.values(target.jointStrength ?? {}).some(
      (strength: number): boolean => strength > 0,
    )
  );
}
