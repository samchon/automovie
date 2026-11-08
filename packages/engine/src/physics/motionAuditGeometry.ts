import type { IAutoMovieMotionGeometry } from "@automovie/interface";

import type { AutoMovieMotionAudit as Audit } from "./AutoMovieMotionAudit";

/**
 * Resolve the already admitted exclusive description; a physical profile structurally supplies the same collision and joint facts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Resolve the already admitted exclusive description; a physical profile structurally supplies the same collision and joint facts) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve the already admitted exclusive description; a physical profile structurally supplies the same collision and joint facts) directly over its typed inputs (`body`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 4 lines and 2 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function motionAuditGeometry(
  body: Audit.IBody,
): IAutoMovieMotionGeometry {
  if (body.profile !== undefined) return body.profile;
  return body.geometry!;
}
