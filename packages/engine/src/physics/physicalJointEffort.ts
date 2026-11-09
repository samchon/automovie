/**
 * Effective tracking fraction of one joint motor at one native tick.
 *
 * An explicit per-joint override replaces the body's effort; a joint inside a
 * moving recovery limb takes the balance policy's joint fraction; a joint whose
 * child received a disturbance stays compliant, multiplied by the declared
 * compliance fraction, until its softening deadline has passed. The factors
 * are independent, so they multiply.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Effective tracking fraction of one joint motor at one native tick) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Effective tracking fraction of one joint motor at one native tick) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 7 lines and 4 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalJointEffort(input: {
  /** Body tracking fraction for this interval, in [0, 1]. */ effort: number;
  /** Explicit per-joint fraction, when the target declares one. */ override?: number;
  /** Balance joint fraction, present only while this joint's limb is a moving recovery limb. */ recovery?: number;
  /** Seconds until which the joint's child stays softened; absent when it never was. */ softenedUntil?: number;
  /** Current native tick time, seconds. */ seconds: number;
  /** Tracking fraction while compliant, in [0, 1]. */ compliance: number;
}): number {
  const base: number = input.override ?? input.effort;
  const recovery: number = input.recovery ?? 1;
  const compliant: boolean =
    input.softenedUntil !== undefined && input.softenedUntil >= input.seconds;
  return base * recovery * (compliant ? input.compliance : 1);
}
