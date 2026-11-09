import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Resolve an authored support point from its owning bone, including rigs without a separate foot bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Resolve an authored support point from its owning bone, including rigs without a separate foot bone) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve an authored support point from its owning bone, including rigs without a separate foot bone) directly over its typed inputs (`pose`, `localPoint`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.add`, `Quaternion.rotateVector`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 1 top-level statements that reuses `Vector3.add`, `Quaternion.rotateVector` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `pose`, `localPoint`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function physicalSupportPoint(
  pose: P.ITransform,
  localPoint?: IAutoMovieVector3,
): IAutoMovieVector3 {
  return localPoint
    ? Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, localPoint),
      )
    : { ...pose.position };
}
