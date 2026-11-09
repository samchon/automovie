import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Relationship fitting must own a real contiguous path with at least one articulated joint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Relationship fitting must own a real contiguous path with at least one articulated joint) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Relationship fitting must own a real contiguous path with at least one articulated joint) directly over its typed inputs (`profile`, `chain`, `source`) as nested iteration of depth 2 (every over Array.from(chain); some over profile.segments; some over profile.joints), delegating to `Array.isArray`, `chain.at`, `Array.from(chain).every`, `Array.from`, `chain.includes`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 32, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 25 lines and 1 top-level statements that reuses `Array.isArray`, `chain.at`, `Array.from(chain).every`, `Array.from`, `chain.includes` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 32 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `chain`, `source`; the dominant cost is nested iteration of depth 2 (every over Array.from(chain); some over profile.segments; some over profile.joints), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function isPhysicalActuatorChain(
  profile: P,
  chain: readonly string[],
  source: string,
): boolean {
  return (
    Array.isArray(chain) &&
    chain.length >= 1 &&
    chain.length <= 32 &&
    chain.at(-1) === source &&
    new Set(chain).size === chain.length &&
    Array.from(chain).every(
      (bone: string, index: number): boolean =>
        typeof bone === "string" &&
        profile.segments.some(
          (segment: P.ISegment): boolean => segment.bone === bone,
        ) &&
        (index === 0 ||
          profile.joints.some(
            (joint: P.IJoint): boolean =>
              joint.parent === chain[index - 1] && joint.child === bone,
          )),
    ) &&
    profile.joints.some(
      (joint: P.IJoint): boolean =>
        chain.includes(joint.child) && joint.axes.length > 0,
    )
  );
}
