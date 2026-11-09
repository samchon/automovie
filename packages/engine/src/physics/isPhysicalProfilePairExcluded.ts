import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Shared self-contact exclusions for native filtering, goal fitting and audit. Same owners, direct joint neighbours and declared overlapping pivot regions cannot collide with themselves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Shared self-contact exclusions for native filtering, goal fitting and audit) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Shared self-contact exclusions for native filtering, goal fitting and audit) directly over its typed inputs (`profile`, `a`, `b`) as 2 sequential passes (some over profile.joints; some over profile.collisionExclusions); the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 15 lines and 1 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `a`, `b`; the dominant cost is 2 sequential passes (some over profile.joints; some over profile.collisionExclusions), performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function isPhysicalProfilePairExcluded(
  profile: P,
  a: string,
  b: string,
): boolean {
  return (
    a === b ||
    profile.joints.some(
      (joint: P.IJoint): boolean =>
        (joint.parent === a && joint.child === b) ||
        (joint.parent === b && joint.child === a),
    ) ||
    (profile.collisionExclusions?.some(
      (pair: NonNullable<P["collisionExclusions"]>[number]): boolean =>
        (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a),
    ) ??
      false)
  );
}
