import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Read a proximal-to-distal actuator path from an admitted tree. The fixed root has no incoming actuator and is omitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Read a proximal-to-distal actuator path from an admitted tree) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Read a proximal-to-distal actuator path from an admitted tree) directly over its typed inputs (`profile`, `bone`) as nested iteration of depth 2 (find over profile.joints; while loop; some over profile.joints), delegating to `chain.unshift`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 18 lines and 4 top-level statements that reuses `chain.unshift` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `bone`; the dominant cost is nested iteration of depth 2 (find over profile.joints; while loop; some over profile.joints), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function physicalJointChain(profile: P, bone: string): string[] {
  const chain: string[] = [bone];
  let joint: P.IJoint | undefined = profile.joints.find(
    (candidate: P.IJoint): boolean => candidate.child === bone,
  );
  while (
    joint &&
    profile.joints.some(
      (candidate: P.IJoint): boolean => candidate.child === joint!.parent,
    )
  ) {
    chain.unshift(joint.parent);
    joint = profile.joints.find(
      (candidate: P.IJoint): boolean => candidate.child === joint!.parent,
    );
  }
  return chain;
}
